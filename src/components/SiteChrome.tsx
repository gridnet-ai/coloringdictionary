import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  children: ReactNode;
  homeHref?: string;
};

const NAV: { href: string; label: string; cta?: boolean }[] = [
  { href: '/#how', label: 'How it works' },
  { href: '/#collection', label: 'The collection' },
  { href: '/#updates', label: 'Stay in the loop', cta: true },
  { href: '/#faq', label: 'FAQ' },
];

export function SiteChrome({ children, homeHref = '/' }: Props) {
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  const year = new Date().getFullYear();

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="header">
        <Link className="brand" to={homeHref} aria-label="Coloring Dictionary home">
            <img
              src="/assets/logo-header.png?v=2"
              width={1024}
              height={512}
              alt="Coloring Dictionary"
            />
        </Link>
        <div className="header-menu">
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
              src="/assets/icon-menu.png"
              width={48}
              height={48}
              alt=""
              aria-hidden="true"
            />
          </button>
        </div>
      </header>
      <div
        ref={panelRef}
        id={menuId}
        className={`menu-panel${menuOpen ? ' is-open' : ''}`}
        hidden={!menuOpen}
        role="dialog"
        aria-label="Site menu"
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
              {item.cta ? <span aria-hidden="true"> ↗</span> : null}
            </a>
          ))}
          <Link to="/login" onClick={() => setMenuOpen(false)}>
            Owner
          </Link>
        </nav>
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
        </div>
        <div>
          <a href="/#how">How it works</a>
          <a href="/#collection">Flower Meanings</a>
          <a href="/#updates">Launch updates</a>
          <a href="/#faq">FAQ</a>
          <Link to="/login">Owner</Link>
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
