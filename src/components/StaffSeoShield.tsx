import { useEffect, type ReactNode } from 'react';

const INDEXABLE =
  'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
const NOINDEX = 'noindex, nofollow, noarchive';

/**
 * Keeps staff surfaces out of search indexes while remaining reachable by
 * direct URL (ChatGPT / MCP fetch with a known link still works).
 */
export function StaffSeoShield({ children }: { children: ReactNode }) {
  useEffect(() => {
    const robots = document.querySelector('meta[name="robots"]');
    const prev = robots?.getAttribute('content') || INDEXABLE;
    if (robots) robots.setAttribute('content', NOINDEX);

    let googlebot = document.querySelector('meta[name="googlebot"]');
    const createdGooglebot = !googlebot;
    if (!googlebot) {
      googlebot = document.createElement('meta');
      googlebot.setAttribute('name', 'googlebot');
      document.head.appendChild(googlebot);
    }
    googlebot.setAttribute('content', NOINDEX);

    document.title = 'Staff · Coloring Dictionary';

    return () => {
      if (robots) robots.setAttribute('content', prev);
      if (createdGooglebot) googlebot?.remove();
      else googlebot?.setAttribute('content', INDEXABLE);
    };
  }, []);

  return <>{children}</>;
}
