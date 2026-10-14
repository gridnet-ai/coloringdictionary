import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AmazonCarousel } from '@/components/AmazonCarousel';
import {
  BrandArrow,
  BrandArrowDown,
  BrandSpark,
} from '@/components/BrandIcons';
import { SiteChrome } from '@/components/SiteChrome';
import { StoreMarks } from '@/components/StoreMarks';
import {
  formatReadingAgeLabel,
  matchesAgeFilter,
  parseAgeGroupParam,
} from '@/lib/ageGroups';
import { FAQS } from '@/lib/siteSeo';
import {
  FLAGSHIP_LISTING,
  HERO_LISTINGS,
  LINE_STYLE_BOOKS,
  publishedAmazonUrl,
} from '@/lib/books';
import { recordVcapHit } from '@/lib/vcapTracking';

export function HomePage() {
  const [searchParams] = useSearchParams();
  const ageFilter = parseAgeGroupParam(searchParams.get('age'));
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
              <a className="text-link hero-explore-link" href="/shop">
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

        <section
          id="line-styles"
          className="line-styles"
          aria-labelledby="line-styles-heading"
        >
          <div className="wrap">
            <div className="section-top">
              <p className="eyebrow">Coloring practice</p>
              <h2 id="line-styles-heading">
                Two line styles.
                <br />
                Your way to color.
              </h2>
              <p>
                Choose bold black boundaries or thin, light-gray guides. Explore
                the same 60 designs through two different coloring experiences.
              </p>
            </div>
            <div className="line-style-grid">
              {LINE_STYLE_BOOKS.map((book) => {
                const shopUrl = publishedAmazonUrl(book);
                return (
                  <article className="book-card" key={book.slug}>
                    <div className="line-style-cover">
                      <img
                        src={book.cover}
                        alt={book.coverAlt ?? `${book.title} front cover`}
                        width={791}
                        height={1024}
                        loading="lazy"
                      />
                    </div>
                    <div className="book-body">
                      <p className="book-series">{book.series}</p>
                      <p className="book-ages">
                        {book.agesLabel ?? formatReadingAgeLabel(book.readingAge)}
                      </p>
                      <h3>{book.title}</h3>
                      <p className="book-subtitle">{book.subtitle}</p>
                      <p className="book-blurb">{book.blurb}</p>
                      <StoreMarks
                        onPaper
                        href={shopUrl}
                        onClick={() =>
                          recordVcapHit('amazon_cta', '/#line-styles', {
                            book: book.slug,
                          })
                        }
                      />
                      {shopUrl ? null : (
                        <p className="amazon-note">Coming soon on Amazon</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
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

        <section id="faq" className="wrap faq" aria-label="Frequently asked questions">
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
