import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  children: ReactNode;
  homeHref?: string;
};

export function SiteChrome({ children, homeHref = '/' }: Props) {
  const [dark, setDark] = useState(false);

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

  const year = new Date().getFullYear();

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="header">
        <Link className="brand" to={homeHref} aria-label="Coloring Dictionary home">
          <img
            src="/assets/logo-header.png"
            width={1774}
            height={887}
            alt="Coloring Dictionary"
          />
        </Link>
        <nav aria-label="Main navigation">
          <a href="/#how">How it works</a>
          <a href="/#collection">The collection</a>
          <a href="/#updates" className="nav-cta">
            Stay in the loop <span aria-hidden="true">↗</span>
          </a>
        </nav>
        <button
          className="theme"
          type="button"
          aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
          title="Change color theme"
          onClick={() => setDark((v) => !v)}
        >
          ◐
        </button>
      </header>
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
