import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BrandArrow, BrandCart } from '@/components/BrandIcons';
import {
  AGE_GROUPS,
  ageGroupById,
  parseAgeGroupParam,
  type AgeGroupId,
} from '@/lib/ageGroups';
import { useCart } from '@/lib/cart';
import { ageHref, filterCatalog } from '@/lib/shopSearch';

type Props = {
  children: ReactNode;
  homeHref?: string;
};

const NAV: { href: string; label: string; cta?: boolean }[] = [
  { href: '/shop', label: 'Shop' },
  { href: '/login', label: 'Sign in' },
  { href: '/#how', label: 'How it works' },
  { href: '/#collection', label: 'The collection' },
  { href: '/#updates', label: 'Stay in the loop', cta: true },
  { href: '/#faq', label: 'FAQ' },
];

export function SiteChrome({ children, homeHref = '/' }: Props) {
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { count } = useCart();
  const onShop = location.pathname.startsWith('/shop');
  const activeAge = onShop
    ? parseAgeGroupParam(searchParams.get('age'))
    : null;
  const queryParam = onShop ? searchParams.get('q') || '' : '';
  const [searchDraft, setSearchDraft] = useState(queryParam);
  const menuId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputId = useId();

  useEffect(() => {
    setSearchDraft(queryParam);
  }, [queryParam]);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem('cd-theme');
    } catch {
      /* ignore */
    }
    const startsDark = saved
      ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(startsDark);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#082f35' : '#00505a');
    try {
      localStorage.setItem('cd-theme', dark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }, [dark]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    function onPointer(e: MouseEvent) {
      const t = e.target as Node;
      if (
        panelRef.current?.contains(t) ||
        buttonRef.current?.contains(t)
      ) {
        return;
      }
      setMenuOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [menuOpen]);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    return () => document.body.classList.remove('menu-open');
  }, [menuOpen]);

  // Live-filter the shop grid while typing
  useEffect(() => {
    if (!onShop) return;
    const handle = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      const trimmed = searchDraft.trim();
      if (trimmed) next.set('q', trimmed);
      else next.delete('q');
      const curr = searchParams.toString();
      const upcoming = next.toString();
      if (curr !== upcoming) setSearchParams(next, { replace: true });
    }, 180);
    return () => window.clearTimeout(handle);
  }, [searchDraft, onShop, searchParams, setSearchParams]);

  const year = new Date().getFullYear();
  const ageGroup = ageGroupById(activeAge || 'all');
  const matched = onShop
    ? filterCatalog({ age: searchParams.get('age'), q: searchParams.get('q') })
    : [];
  const resultQuery = (searchParams.get('q') || '').trim();

  function linkAge(id: AgeGroupId) {
    return ageHref(id, onShop ? searchDraft : searchParams.get('q'));
  }

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = searchDraft.trim();
    if (onShop) {
      const next = new URLSearchParams(searchParams);
      if (trimmed) next.set('q', trimmed);
      else next.delete('q');
      setSearchParams(next);
      return;
    }
    const params = new URLSearchParams();
    if (trimmed) params.set('q', trimmed);
    navigate(params.toString() ? `/shop?${params}` : '/shop');
  }

  function openCart() {
    if (onShop) {
      window.dispatchEvent(new Event('cd-open-cart'));
    } else {
      navigate('/shop');
    }
  }

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="site-top">
        <header className="header">
          <Link
            className="brand"
            to={homeHref}
            aria-label="Coloring Dictionary home"
          >
            <img
              src="/assets/logo-header.png?v=2"
              width={1024}
              height={512}
              alt="Coloring Dictionary"
            />
          </Link>

          <form className="header-search" role="search" onSubmit={onSearchSubmit}>
            <label className="visually-hidden" htmlFor={searchInputId}>
              Search books by word, phrase, or prompt
            </label>
            <input
              id={searchInputId}
              className="header-search-input"
              type="search"
              name="q"
              value={searchDraft}
              placeholder="Search by word, phrase, or prompt"
              autoComplete="off"
              enterKeyHint="search"
              onChange={(e) => setSearchDraft(e.target.value)}
            />
            <button className="header-search-btn" type="submit" aria-label="Search">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
                <path
                  d="M20 20l-3.5-3.5"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </form>

          <div className="header-tools">
            <button
              type="button"
              className="header-cart"
              aria-label={
                onShop
                  ? `Open cart${count ? `, ${count} items` : ''}`
                  : `Shop cart${count ? `, ${count} items` : ''}`
              }
              onClick={openCart}
            >
              <BrandCart />
              <span className="header-cart-label">Cart</span>
              {count > 0 ? (
                <span className="header-cart-count">{count}</span>
              ) : (
                <span className="header-cart-count is-zero">0</span>
              )}
            </button>
            <button
              ref={buttonRef}
              className={`menu-toggle${menuOpen ? ' is-open' : ''}`}
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <img
                src="/assets/icon-menu-on-dark.png"
                width={48}
                height={48}
                alt=""
                aria-hidden="true"
              />
            </button>
          </div>
        </header>

        <nav className="header-subnav" aria-label="Browse by age">
          <ul className="header-subnav-list">
            {AGE_GROUPS.map((group) => {
              const selected = onShop && activeAge === group.id;
              return (
                <li key={group.id}>
                  <Link
                    to={linkAge(group.id)}
                    className={`header-subnav-link${selected ? ' is-active' : ''}`}
                    aria-current={selected ? 'page' : undefined}
                    title={group.audience}
                    onClick={() => setMenuOpen(false)}
                  >
                    {group.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {onShop ? (
          <div className="header-results" aria-live="polite">
            <p className="header-results-text">
              {matched.length === 0 ? (
                <>No results{resultQuery ? <> for <em>{resultQuery}</em></> : null}</>
              ) : resultQuery ? (
                <>
                  <strong>1–{matched.length}</strong> of{' '}
                  <strong>{matched.length}</strong> results for{' '}
                  <em>{resultQuery}</em>
                </>
              ) : (
                <>
                  <strong>{matched.length}</strong> title
                  {matched.length === 1 ? '' : 's'}
                  {activeAge && activeAge !== 'all' ? (
                    <>
                      {' '}
                      in <strong>{ageGroup.label}</strong>
                      <span className="header-results-muted">
                        {' '}
                        · {ageGroup.audience}
                      </span>
                    </>
                  ) : (
                    <span className="header-results-muted"> · All ages</span>
                  )}
                </>
              )}
            </p>
          </div>
        ) : null}
      </div>

      <div
        ref={panelRef}
        id={menuId}
        className={`menu-panel${menuOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-label="Site menu"
        aria-hidden={!menuOpen}
        inert={!menuOpen ? true : undefined}
      >
        <nav aria-label="Main navigation">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={item.cta ? 'nav-cta' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
              {item.cta ? (
                <>
                  {' '}
                  <BrandArrow tone="auto" />
                </>
              ) : null}
            </a>
          ))}
        </nav>
        <div className="menu-ages" role="group" aria-labelledby={`${menuId}-ages`}>
          <p className="menu-ages-label" id={`${menuId}-ages`}>
            Browse by age
          </p>
          <ul className="menu-ages-list">
            {AGE_GROUPS.map((group) => {
              const selected = onShop && activeAge === group.id;
              return (
                <li key={group.id}>
                  <Link
                    to={linkAge(group.id)}
                    className={`menu-age-link${selected ? ' is-active' : ''}`}
                    aria-current={selected ? 'true' : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="menu-age-range">{group.label}</span>
                    <span className="menu-age-audience">{group.audience}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <button
          className="menu-theme"
          type="button"
          aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
          title="Change color theme"
          onClick={() => setDark((v) => !v)}
        >
          <span aria-hidden="true">◐</span>
          <span>{dark ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>
      {menuOpen ? (
        <button
          type="button"
          className="menu-backdrop"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      {children}
      <footer className="wrap footer">
        <div>
          <strong>Coloring Dictionary</strong>
          <p>Color • Learn • Grow</p>
          <nav className="footer-social" aria-label="Social">
            <a
              href="https://x.com/coloringdiction"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Coloring Dictionary on X"
            >
              <img src="/brand/social-x.svg" alt="" width={28} height={28} />
            </a>
            <a
              href="https://www.instagram.com/coloringdictionary"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Coloring Dictionary on Instagram"
            >
              <img src="/brand/social-instagram.svg" alt="" width={28} height={28} />
            </a>
            <a
              href="https://www.tiktok.com/@coloringdictionary"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Coloring Dictionary on TikTok"
            >
              <img src="/brand/social-tiktok.svg" alt="" width={28} height={28} />
            </a>
          </nav>
        </div>
        <div>
          <Link to="/shop">Shop</Link>
          <Link to="/login">Sign in</Link>
          <a href="/#how">How it works</a>
          <a href="/#collection">Flower Meanings</a>
          <a href="/#updates">Launch updates</a>
          <a href="/#faq">FAQ</a>
        </div>
        <div className="footer-note">
          © {year} Coloring Dictionary
          <br />
          A dictionary you can color.
        </div>
      </footer>
    </>
  );
}
