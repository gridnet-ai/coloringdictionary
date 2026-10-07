import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { listContacts, listOpportunities, saveContact, saveOpportunity } from '@/lib/crmLocal';
import { runSampleExportChecks } from '@/lib/exportChecks';
import { loadOwnerBundle, type SeedManifest } from '@/lib/seedClient';
import type {
  BookRecord,
  CreativeAsset,
  CrmContact,
  CrmOpportunity,
  FlowerEntry,
} from '@/lib/db/types';

type Tab =
  | 'overview'
  | 'flowers'
  | 'books'
  | 'assets'
  | 'crm'
  | 'jobs'
  | 'export';

export function OwnerDashboard() {
  const { ready, user, isOwnerWorkspace, logout } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'overview';
  const [manifest, setManifest] = useState<SeedManifest | null>(null);
  const [flowers, setFlowers] = useState<FlowerEntry[]>([]);
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [assets, setAssets] = useState<CreativeAsset[]>([]);
  const [dashboard, setDashboard] = useState<Record<string, unknown>[]>([]);
  const [q, setQ] = useState('');
  const [selectedFlower, setSelectedFlower] = useState<FlowerEntry | null>(null);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [opps, setOpps] = useState<CrmOpportunity[]>([]);
  const [crmName, setCrmName] = useState('');
  const [crmEmail, setCrmEmail] = useState('');
  const [crmType, setCrmType] = useState<CrmContact['type']>('reader');
  const [oppTitle, setOppTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bundle = await loadOwnerBundle();
        if (cancelled) return;
        setManifest(bundle.manifest);
        setFlowers(bundle.flowers);
        setBooks(bundle.books);
        setAssets(bundle.assets);
        setDashboard(bundle.dashboard);
        setContacts(listContacts());
        setOpps(listOpportunities());
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Load failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return flowers.slice(0, 50);
    return flowers
      .filter(
        (f) =>
          f.name.toLowerCase().includes(needle) ||
          (f.botanicalName || '').toLowerCase().includes(needle) ||
          (f.catalogNumber || '').toLowerCase().includes(needle) ||
          (f.meanings.terryList || '').toLowerCase().includes(needle),
      )
      .slice(0, 80);
  }, [flowers, q]);

  const sampleBook = books.find((b) => b.id.includes('volume') || /volume/i.test(b.title)) || books[0];
  const exportChecks = useMemo(
    () => runSampleExportChecks({ book: sampleBook, flowers, assets }),
    [sampleBook, flowers, assets],
  );

  if (!ready) return <main className="owner"><p className="owner-body">Loading…</p></main>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isOwnerWorkspace) return <Navigate to="/login" replace />;

  function setTab(next: Tab) {
    setParams(next === 'overview' ? {} : { tab: next });
  }

  function onAddContact(e: FormEvent) {
    e.preventDefault();
    if (!crmName.trim()) return;
    saveContact({
      name: crmName.trim(),
      email: crmEmail.trim() || undefined,
      type: crmType,
      notes: 'Manual entry · local until Firestore CRM sync',
      nextFollowUp: null,
    });
    setContacts(listContacts());
    setCrmName('');
    setCrmEmail('');
  }

  function onAddOpp(e: FormEvent) {
    e.preventDefault();
    if (!oppTitle.trim()) return;
    saveOpportunity({
      title: oppTitle.trim(),
      stage: 'prospect',
      contactId: contacts[0]?.id,
      value: null,
      expectedClose: null,
      outcome: null,
    });
    setOpps(listOpportunities());
    setOppTitle('');
  }

  const verified = flowers.filter((f) => f.verificationStatus === 'verified').length;
  const awaiting = flowers.filter((f) => f.verificationStatus === 'imported_unverified').length;
  const draftPages = books.reduce(
    (n, b) =>
      n +
      b.pages.filter((p) =>
        String(p.status || p['Status'] || '')
          .toLowerCase()
          .includes('draft'),
      ).length,
    0,
  );
  const followUpsDue = contacts.filter((c) => c.nextFollowUp).length;

  return (
    <div className="owner">
      <header className="owner-top">
        <img src="/icons/icon.png" alt="" />
        <div>
          <strong>Owner workspace</strong>
          <div className="owner-note">{user.email}</div>
        </div>
        <nav>
          {(
            [
              ['overview', 'Overview'],
              ['flowers', 'Flowers'],
              ['books', 'Books'],
              ['assets', 'Assets'],
              ['crm', 'CRM'],
              ['jobs', 'Jobs'],
              ['export', 'Export'],
            ] as const
          ).map(([id, label]) => (
            <a
              key={id}
              href={`?tab=${id}`}
              className={tab === id ? 'is-active' : ''}
              onClick={(e) => {
                e.preventDefault();
                setTab(id);
              }}
            >
              {label}
            </a>
          ))}
        </nav>
        <Link to="/">Site</Link>
        <button type="button" onClick={() => void logout()}>
          Sign out
        </button>
      </header>

      <div className="owner-body">
        {loading ? <p>Loading imported records…</p> : null}
        {error ? <p className="login-error">{error}</p> : null}

        {tab === 'overview' && manifest ? (
          <>
            <div className="owner-grid">
              <div className="owner-stat">
                <span>Flower entries</span>
                <strong>{flowers.length}</strong>
                <em>actual · Final Draft recalculated</em>
              </div>
              <div className="owner-stat">
                <span>Awaiting review</span>
                <strong>{awaiting}</strong>
                <em>verified: {verified} · unknown ≠ zero</em>
              </div>
              <div className="owner-stat">
                <span>Books</span>
                <strong>{books.length}</strong>
                <em>draft page rows: {draftPages}</em>
              </div>
              <div className="owner-stat">
                <span>CRM follow-ups</span>
                <strong>{followUpsDue || '—'}</strong>
                <em>{contacts.length} contact(s) · local store</em>
              </div>
            </div>

            <div className="owner-panel">
              <h2>Business overview</h2>
              <p className="owner-note">{manifest.brandPromise}</p>
              <p className="owner-note">Import snapshot: {manifest.importedAt}</p>
              <ul className="owner-note">
                {manifest.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
              <p className="owner-note">
                Integrations: Clarity connected (yu20t0k9dh) · Email SMTP configured in Functions ·
                Firestore seed API demo · KDP API none · Wordnet import pending.
              </p>
            </div>

            <div className="owner-panel">
              <h2>Production dashboard (imported)</h2>
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Status</th>
                    <th>Pages</th>
                    <th>KDP</th>
                    <th>Units</th>
                    <th>Royalty</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.map((row) => (
                    <tr key={String(row.Book)}>
                      <td>{String(row.Book)}</td>
                      <td>{String(row.Status)}</td>
                      <td>{String(row['Pages complete'])}</td>
                      <td>{String(row['KDP status'])}</td>
                      <td>{String(row['Units sold'] ?? 'unknown')}</td>
                      <td>{String(row['Royalty earned'] ?? 'unknown')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="owner-note">
                Sales mapped by header: Date / Units sold / Royalty earned / Notes. Actuals only.
              </p>
            </div>
          </>
        ) : null}

        {tab === 'flowers' ? (
          <div className="owner-split">
            <div className="owner-panel">
              <h2>Flower meanings</h2>
              <input
                className="owner-search"
                placeholder="Search flower, botanical, catalog, meaning…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>Catalog</th>
                    <th>Flower</th>
                    <th>Terry List</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f) => (
                    <tr
                      key={f.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedFlower(f)}
                    >
                      <td>{f.catalogNumber || '—'}</td>
                      <td>
                        <strong>{f.name}</strong>
                        <div className="owner-note">{f.botanicalName}</div>
                      </td>
                      <td>{f.meanings.terryList || '—'}</td>
                      <td>
                        <span className="owner-badge warn">{f.verificationStatus}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="owner-note">
                Showing {filtered.length} of {flowers.length}. Reimport preserves editorialLocked.
              </p>
            </div>
            <div className="owner-panel">
              <h2>Provenance</h2>
              {selectedFlower ? (
                <>
                  <p>
                    <strong>{selectedFlower.name}</strong>
                  </p>
                  <p className="owner-note">ID: {selectedFlower.id}</p>
                  <p className="owner-note">Botanical: {selectedFlower.botanicalName || '—'}</p>
                  <p className="owner-note">
                    Historical (1884): {selectedFlower.meanings.historical1884 || '—'}
                  </p>
                  <p className="owner-note">
                    Modern: {selectedFlower.meanings.modern || '—'}
                  </p>
                  <p className="owner-note">
                    Terry List: {selectedFlower.meanings.terryList || '—'}
                  </p>
                  <p className="owner-note">
                    Publication adaptation: {selectedFlower.meanings.publicationAdaptation || '—'}
                  </p>
                  <p className="owner-note">
                    Signature: {selectedFlower.signatureLine || '—'}
                  </p>
                  <p className="owner-note">When to send: {selectedFlower.whenToSend || '—'}</p>
                  <p className="owner-note">
                    Artwork: {selectedFlower.artwork?.status || '—'} ·{' '}
                    {selectedFlower.artwork?.availability || 'unknown'}
                  </p>
                  <h3 className="owner-note">Import provenance</h3>
                  <ul className="owner-note">
                    {selectedFlower.provenance.map((p, i) => (
                      <li key={i}>
                        {p.workbook} / {p.sheet} row {p.row}
                      </li>
                    ))}
                  </ul>
                  <h3 className="owner-note">Sources</h3>
                  <ul className="owner-note">
                    {selectedFlower.sources.length
                      ? selectedFlower.sources.map((s, i) => (
                          <li key={i}>
                            {s.label || s.url || 'source'} · license {s.license || 'unknown'}
                          </li>
                        ))
                      : <li>No structured sources attached yet</li>}
                  </ul>
                </>
              ) : (
                <p className="owner-note">Select a flower to inspect provenance.</p>
              )}
            </div>
          </div>
        ) : null}

        {tab === 'books' ? (
          <div className="owner-split">
            {books.map((book) => (
              <div className="owner-panel" key={book.id}>
                <h2>{book.edition || book.title}</h2>
                <p className="owner-note">
                  {book.subtitle} · {book.status} · {book.pageCount} page rows
                </p>
                {book.authorCreditNeedsConfirmation ? (
                  <p>
                    <span className="owner-badge warn">Author credit needs confirmation</span>{' '}
                    Imported: {book.authorImported || '—'}
                  </p>
                ) : null}
                <p className="owner-note">{book.format}</p>
                <table className="owner-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Type</th>
                      <th>Flower</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {book.pages.slice(0, 16).map((p, i) => (
                      <tr key={`${book.id}-${i}`}>
                        <td>{String(p['Page #'] ?? p.pageNumber ?? '')}</td>
                        <td>{String(p['Page type'] ?? p.pageType ?? '')}</td>
                        <td>{String(p.Flower ?? p.flower ?? '')}</td>
                        <td>{String(p.Status ?? p.status ?? '')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="owner-note">
                  Guide = even/left · Coloring = odd/right. Progress from page records, not
                  headline totals.
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {tab === 'assets' ? (
          <>
            <div className="owner-panel">
              <h2>Product lifestyle images</h2>
              <p className="owner-note">
                Adults, kids, and family coloring photos reserved for later marketing /
                Build a Coloring Dictionary. Not interior pages.
              </p>
              <div className="owner-asset-grid">
                {assets
                  .filter((a) => a.isProductImage)
                  .map((a) => (
                    <figure key={a.id} className="owner-asset-card">
                      {a.path ? (
                        <img src={a.path} alt={a.alt || a.title || a.id} loading="lazy" />
                      ) : null}
                      <figcaption>
                        <strong>{a.title || a.id}</strong>
                        <span className="owner-badge ok">{a.audience || 'general'}</span>
                        <div className="owner-note">{(a.labels || []).join(' · ')}</div>
                      </figcaption>
                    </figure>
                  ))}
              </div>
            </div>
            <div className="owner-panel">
              <h2>All registered assets</h2>
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Title / ID</th>
                    <th>Kind</th>
                    <th>Audience</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {a.path ? (
                          <img
                            className="owner-thumb"
                            src={a.path}
                            alt=""
                            loading="lazy"
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <strong>{a.title || a.id}</strong>
                        <div className="owner-note">{a.path || a.externalUrl || ''}</div>
                      </td>
                      <td>{a.kind}</td>
                      <td>{a.audience || '—'}</td>
                      <td>
                        {a.isProductImage ? (
                          <span className="owner-badge ok">product image</span>
                        ) : null}{' '}
                        {a.isMarketingMockup ? (
                          <span className="owner-badge warn">mockup</span>
                        ) : (
                          a.status
                        )}
                      </td>
                      <td>{a.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {tab === 'crm' ? (
          <div className="owner-split">
            <div className="owner-panel">
              <h2>Contacts</h2>
              <p className="owner-note">
                Manual entry only. No invented contacts. No automated outreach. Stored locally
                until Firestore CRM sync is enabled.
              </p>
              <form className="owner-form" onSubmit={onAddContact}>
                <input
                  placeholder="Name"
                  value={crmName}
                  onChange={(e) => setCrmName(e.target.value)}
                  required
                />
                <input
                  placeholder="Email (optional)"
                  value={crmEmail}
                  onChange={(e) => setCrmEmail(e.target.value)}
                />
                <select
                  value={crmType}
                  onChange={(e) => setCrmType(e.target.value as CrmContact['type'])}
                >
                  <option value="reader">Reader</option>
                  <option value="educator">Educator</option>
                  <option value="retailer">Retailer</option>
                  <option value="partner">Partner</option>
                  <option value="supplier">Supplier</option>
                  <option value="other">Other</option>
                </select>
                <button type="submit">Add contact</button>
              </form>
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.type}</td>
                      <td>{c.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="owner-panel">
              <h2>Opportunities</h2>
              <form className="owner-form" onSubmit={onAddOpp}>
                <input
                  placeholder="Opportunity title"
                  value={oppTitle}
                  onChange={(e) => setOppTitle(e.target.value)}
                  required
                />
                <button type="submit">Add opportunity</button>
              </form>
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Stage</th>
                    <th>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {opps.map((o) => (
                    <tr key={o.id}>
                      <td>{o.title}</td>
                      <td>{o.stage}</td>
                      <td>{o.contactId || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {tab === 'jobs' ? (
          <div className="owner-panel">
            <h2>Production jobs</h2>
            <p className="owner-note">
              Pipeline: select → sources → draft → verify → illustrate → QA → compose →
              validate → export. Resumable jobs + cost tracking are scaffolded; generation
              providers are not connected yet (labeled demo).
            </p>
            <p>
              Collection: <code>productionJobs</code>
            </p>
            <ul className="owner-note">
              <li>Duplicate-job prevention: planned by bookId + entry set hash</li>
              <li>Failures route to review — do not invent missing meanings or licenses</li>
              <li>Final book approval required before publication</li>
            </ul>
          </div>
        ) : null}

        {tab === 'export' ? (
          <div className="owner-panel">
            <h2>Sample export checks</h2>
            <p className="owner-note">
              Book under check: {sampleBook?.title || 'none'} · Guide even/left · Coloring
              odd/right
            </p>
            <table className="owner-table">
              <thead>
                <tr>
                  <th>Check</th>
                  <th>Status</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {exportChecks.map((c) => (
                  <tr key={c.id}>
                    <td>{c.label}</td>
                    <td>
                      <span
                        className={`owner-badge ${c.status === 'pass' ? 'ok' : 'warn'}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td>{c.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="owner-note">
              Print outputs: interior PDF + separate full-wrap cover PDF. KDP upload remains
              manual unless a supported integration is confirmed later.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
