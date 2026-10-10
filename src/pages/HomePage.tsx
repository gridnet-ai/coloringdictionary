import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AmazonCarousel } from '@/components/AmazonCarousel';
import {
  BrandArrow,
  BrandArrowDown,
  BrandSpark,
} from '@/components/BrandIcons';
import { SiteChrome } from '@/components/SiteChrome';
import { StoreMarks } from '@/components/StoreMarks';
import {
  ageGroupById,
  formatReadingAgeLabel,
  matchesAgeFilter,
  parseAgeGroupParam,
} from '@/lib/ageGroups';
import { FAQS } from '@/lib/siteSeo';
import { BOOKS, FLAGSHIP_LISTING, HERO_LISTINGS } from '@/lib/books';
import { recordVcapHit } from '@/lib/vcapTracking';

export function HomePage() {
  const [searchParams] = useSearchParams();
  const ageFilter = parseAgeGroupParam(searchParams.get('age'));
  const ageGroup = ageGroupById(ageFilter);
  const books = BOOKS.filter((b) =>
    matchesAgeFilter(b.readingAge, ageFilter, b.ageFilters ?? ['all']),
  );
  const inventory = HERO_LISTINGS.filter((item) =>
    matchesAgeFilter(item.readingAge, ageFilter),
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewAlt, setPreviewAlt] = useState('');
  const [status, setStatus] = useState(
    'Get occasional book previews and release news.',
  );

  useEffect(() => {
    recordVcapHit('origin_html', '/');
  }, []);

  function openPreview(src: string, alt: string) {
    setPreviewSrc(src);
    setPreviewAlt(alt);
    dialogRef.current?.showModal();
    recordVcapHit('preview_open', src, { alt });
  }

  async function onSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get('email');
    if (typeof email !== 'string' || !email.trim()) return;

    setStatus('Signing you up…');
    recordVcapHit('signup_intent', '/#updates');

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: 'website',
          consent: true,
        }),
      });
      if (!response.ok) throw new Error('Signup failed');
      setStatus('You’re on the list. Look out for our first chapter.');
      form.reset();
    } catch {
      setStatus('We couldn’t complete your signup. Please try again.');
    }
  }

  return (
    <SiteChrome>
      <main id="main">
        <section className="hero wrap">
          <div className="hero-copy">
            <h1>
              A dictionary
              <br />
              you can{' '}
              <em className="hero-word hero-word--color">
                <img
                  src="/brand/hero-color.png"
                  alt="color"
                  width={986}
                  height={260}
                  decoding="async"
                  draggable={false}
                />
                <span className="hero-word-period" aria-hidden="true">
                  .
                </span>
              </em>
            </h1>
            <p className="intro">
              Get to know the world, one page at a time. A guide to discover. A
              picture to make your own.
            </p>
            <div className="actions">
              <StoreMarks
                href={FLAGSHIP_LISTING.amazonUrl}
                onPaper
                onClick={() =>
                  recordVcapHit('amazon_cta', '/#hero', { book: FLAGSHIP_LISTING.slug })
                }
              />
              <a className="text-link hero-explore-link" href="#collection">
                <img
                  className="hero-word hero-word--explore"
                  src="/brand/hero-explore.png"
                  alt="Explore the series"
                  width={979}
                  height={198}
                  decoding="async"
                  draggable={false}
                />
                <BrandArrowDown tone="teal" />
              </a>
            </div>
            <p className="hero-note">For curious minds of all ages.</p>
          </div>
          <aside className="az-inventory" aria-label="Books on Amazon">
            {inventory.map((item) => (
              <article className="az-inventory-card" key={item.slug}>
                <button
                  type="button"
                  className="az-listing-cover"
                  aria-label={`Preview cover: ${item.title}`}
                  onClick={() => openPreview(item.cover, `${item.title} cover`)}
                >
                  <img src={item.cover} alt="" width={400} height={520} />
                </button>
                <h2 className="az-inventory-title">{item.title}</h2>
                {item.kind ? <p className="az-inventory-meta">{item.kind}</p> : null}
                <p className="az-inventory-stars" aria-label="4 out of 5 stars">
                  <span aria-hidden="true">★★★★☆</span>
                </p>
                {item.price ? (
                  <p className="az-inventory-price">
                    <span className="az-price-currency">$</span>
                    <span className="az-price-whole">{item.price.whole}</span>
                    <span className="az-price-frac">{item.price.frac}</span>
                  </p>
                ) : null}
                <StoreMarks
                  href={item.amazonUrl || undefined}
                  onClick={() =>
                    recordVcapHit('amazon_cta', '/#hero-listing', {
                      book: item.slug,
                    })
                  }
                />
              </article>
            ))}
          </aside>
        </section>

        <AmazonCarousel onPreview={openPreview} />

        <div className="brand-strip" aria-label="Color Learn Grow">
          <span>
            COLOR <BrandSpark />
          </span>
          <span>
            LEARN <BrandSpark />
          </span>
          <span>
            GROW <BrandSpark />
          </span>
          <span className="strip-extra" aria-hidden="true">
            COLOR <BrandSpark />
          </span>
        </div>

        <section id="how" className="wrap how">
          <div className="section-top">
            <p className="eyebrow">OPEN IT UP. LET CURIOSITY IN.</p>
            <h2>
              Two pages.
              <br />
              A whole new way to explore.
            </h2>
            <p>
              Keep the guide beside you as you color. Follow nature’s palette or
              dream up your own.
            </p>
          </div>
          <div className="steps">
            <article>
              <span className="number">01</span>
              <h3>Meet the subject.</h3>
              <p>
                Find its name, meaning and a few memorable facts on the left-hand
                page.
              </p>
            </article>
            <article>
              <span className="number">02</span>
              <h3>Find your colors.</h3>
              <p>
                Look at the colored examples. Notice the shapes, shades and little
                details.
              </p>
            </article>
            <article>
              <span className="number">03</span>
              <h3>Make it yours.</h3>
              <p>
                Bring the facing illustration to life. There’s room for your
                imagination.
              </p>
            </article>
          </div>
        </section>

        <section id="collection" className="collection">
          <div className="wrap">
            <div className="collection-title">
              <div>
                <p className="eyebrow">THE SERIES</p>
                <h2>
                  Flower Meanings
                  <br />
                  for every season.
                </h2>
              </div>
              <div className="collection-aside">
                <span className="pill">ON AMAZON</span>
                <p>
                  <strong>Coloring Dictionary books</strong>
                  <br />
                  Each volume pairs a colored guide with a facing page to make
                  your own. More titles are on the way.
                </p>
              </div>
            </div>
            <div className="age-filter-bar" aria-live="polite">
              <p className="age-filter-active">
                Showing:{' '}
                <strong>{ageGroup.label}</strong>
                {ageFilter !== 'all' ? (
                  <span className="age-filter-audience">
                    {' '}
                    — {ageGroup.audience}
                  </span>
                ) : null}
              </p>
              <Link
                className="age-filter-clear"
                to={ageFilter === 'all' ? '/shop' : `/shop?age=${ageFilter}`}
              >
                Shop this age band
              </Link>
            </div>
            <div className="book-grid">
              {books.length === 0 ? (
                <p className="age-filter-empty">
                  No titles in this age band yet. Try another group from the
                  menu, or{' '}
                  <Link to="/#collection">show all ages</Link>.
                </p>
              ) : null}
              {books.map((book) => {
                const onAmazon = Boolean(book.amazonUrl);
                return (
                  <article className="book-card" key={book.slug}>
                    <button
                      type="button"
                      className="book-cover-btn"
                      aria-label={`Preview cover: ${book.series} — ${book.title}`}
                      onClick={() =>
                        openPreview(
                          book.cover,
                          `${book.series} — ${book.title} cover`,
                        )
                      }
                    >
                      <div className="book-cover">
                        <img
                          src={book.cover}
                          alt={`Cover: Coloring Dictionary ${book.series} — ${book.title}`}
                          loading="lazy"
                          width={600}
                          height={900}
                        />
                      </div>
                    </button>
                    <div className="book-body">
                      {book.badge ? (
                        <span className="book-badge">{book.badge}</span>
                      ) : null}
                      <p className="book-series">{book.series}</p>
                      <p className="book-ages">
                        {book.agesLabel ?? formatReadingAgeLabel(book.readingAge)}
                      </p>
                      <h3>{book.title}</h3>
                      <p className="book-subtitle">{book.subtitle}</p>
                      <p className="book-blurb">{book.blurb}</p>
                      <StoreMarks
                        onPaper
                        href={
                          onAmazon
                            ? book.amazonUrl
                            : book.series === 'Flower Meanings'
                              ? 'https://www.amazon.com/s?k=Coloring+Dictionary+Flower+Meanings'
                              : undefined
                        }
                        onClick={() =>
                          recordVcapHit('amazon_cta', '/#collection', {
                            book: book.slug,
                          })
                        }
                      />
                      {!onAmazon ? (
                        <p className="amazon-note">Coming soon on Amazon</p>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="collection-note">
              Peek at sample flower pages:{' '}
              <Link to="/flowers/white-clover/">White Clover</Link>,{' '}
              <Link to="/flowers/coreopsis/">Coreopsis</Link>,{' '}
              <Link to="/flowers/pink-carnation/">Pink Carnation</Link>.
              Meanings vary across cultures; we share selected, sourced
              associations.
            </p>
          </div>
        </section>

        <section className="wrap philosophy">
          <p className="eyebrow">YOUR PAGE. YOUR PALETTE.</p>
          <h2>
            Nature gives you a guide.
            <br />
            <em>You bring the color.</em>
          </h2>
          <p>
            A quiet afternoon. A page shared with someone you love. Something new
            to discover. Start wherever curiosity takes you.
          </p>
          <a className="text-link" href="#updates">
            Follow the first collection <BrandArrow tone="auto" />
          </a>
        </section>

        <section id="faq" className="wrap faq">
          <p className="eyebrow">A FEW THINGS TO KNOW</p>
          <h2>Curiosity starts here.</h2>
          {FAQS.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </section>

        <section id="updates" className="updates wrap">
          <div>
            <p className="eyebrow">GOOD THINGS ARE GROWING</p>
            <h2>
              Be there for
              <br />
              the first chapter.
            </h2>
            <p>Book previews, new subjects and news about our first release.</p>
          </div>
          <div className="signup">
            <label htmlFor="email">Your email address</label>
            <form onSubmit={onSignup}>
              <div className="input-row">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
                <button className="button" type="submit">
                  Keep me posted <BrandArrow />
                </button>
              </div>
              <p className="signup-status" aria-live="polite">
                {status}
              </p>
            </form>
            <p className="signup-note">
              A little color in your inbox. Unsubscribe anytime once signup opens.
            </p>
          </div>
        </section>
      </main>

      <dialog ref={dialogRef} id="preview-dialog">
        <button
          id="close-preview"
          type="button"
          aria-label="Close preview"
          onClick={() => dialogRef.current?.close()}
        >
          ×
        </button>
        {previewSrc ? (
          <img src={previewSrc} alt={previewAlt || 'Enlarged sample book page'} />
        ) : null}
        <p>Draft page preview</p>
      </dialog>
    </SiteChrome>
  );
}
