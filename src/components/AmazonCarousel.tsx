import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { matchesAgeFilter, parseAgeGroupParam } from '@/lib/ageGroups';
import { CAROUSEL_LISTINGS, type AmazonListingCard } from '@/lib/books';
import { recordVcapHit } from '@/lib/vcapTracking';

type Props = {
  onPreview: (src: string, alt: string) => void;
};

function ListingCard({
  item,
  onPreview,
}: {
  item: AmazonListingCard;
  onPreview: (src: string, alt: string) => void;
}) {
  const href =
    item.amazonUrl ||
    `https://www.amazon.com/s?k=${encodeURIComponent(item.title)}`;

  return (
    <article className="az-card">
      <button
        type="button"
        className="az-card-cover"
        aria-label={`Preview cover: ${item.title}`}
        onClick={() => onPreview(item.cover, `${item.title} cover`)}
      >
        {item.badge ? <span className="az-badge">{item.badge}</span> : null}
        <img src={item.cover} alt="" width={400} height={520} loading="lazy" />
      </button>
      <div className="az-card-body">
        <h3 className="az-card-title">
          <a href={href} target="_blank" rel="noopener noreferrer">
            {item.title}
          </a>
        </h3>
        {item.seriesLabel ? (
          <p className="az-series">
            <a href={href} target="_blank" rel="noopener noreferrer">
              {item.seriesLabel}
            </a>
          </p>
        ) : null}
        {item.rating ? (
          <p className="az-rating" aria-label={`Rated ${item.rating} out of 5`}>
            <span className="az-rating-num">{item.rating}</span>
            <span className="az-stars" aria-hidden="true">
              ★★★★★
            </span>
            {item.reviewCount ? (
              <span className="az-reviews">({item.reviewCount})</span>
            ) : null}
          </p>
        ) : (
          <p className="az-rating az-rating--new">New on Amazon</p>
        )}
        <p className="az-format">{item.format}</p>
        {item.price ? (
          <p className="az-price">
            <span className="az-price-currency">$</span>
            <span className="az-price-whole">{item.price.whole}</span>
            <span className="az-price-frac">{item.price.frac}</span>
            {item.listPrice ? (
              <span className="az-list">
                {' '}
                List: <s>{item.listPrice}</s>
              </span>
            ) : null}
          </p>
        ) : (
          <p className="az-price az-price--see">See price on Amazon</p>
        )}
        {item.ages ? <p className="az-ages">Ages: {item.ages}</p> : null}
        <a
          className="az-cart"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            recordVcapHit('amazon_cta', '/#carousel', { book: item.slug })
          }
        >
          {item.cta || 'Buy on Amazon'}
        </a>
      </div>
    </article>
  );
}

export function AmazonCarousel({ onPreview }: Props) {
  const [searchParams] = useSearchParams();
  const ageFilter = parseAgeGroupParam(searchParams.get('age'));
  const listings = CAROUSEL_LISTINGS.filter((item) =>
    matchesAgeFilter(item.readingAge, ageFilter),
  );
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ left: 0, width: 40, visible: false });

  function syncThumb() {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 1) {
      setThumb((t) => ({ ...t, visible: false }));
      return;
    }
    const ratio = el.clientWidth / el.scrollWidth;
    const width = Math.max(18, Math.round(ratio * 100));
    const left = Math.round((el.scrollLeft / max) * (100 - width));
    setThumb({ left, width, visible: true });
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const run = () => {
      requestAnimationFrame(syncThumb);
    };
    run();
    // Covers after images/layout settle
    const t = window.setTimeout(run, 120);
    el.addEventListener('scroll', syncThumb, { passive: true });
    const ro = new ResizeObserver(run);
    ro.observe(el);
    window.addEventListener('resize', run);
    return () => {
      window.clearTimeout(t);
      el.removeEventListener('scroll', syncThumb);
      ro.disconnect();
      window.removeEventListener('resize', run);
    };
  }, []);

  function scrollBy(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir * Math.min(340, el.clientWidth * 0.8),
      behavior: 'smooth',
    });
  }

  return (
    <section className="az-carousel-wrap" aria-label="More Coloring Dictionary books">
      <div className="az-carousel-head wrap">
        <h2>More in the series</h2>
        <p>Shop Coloring Dictionary titles on Amazon</p>
      </div>
      <div className="az-carousel-shell">
        <button
          type="button"
          className="az-nav az-nav--prev"
          aria-label="Scroll carousel left"
          onClick={() => scrollBy(-1)}
        >
          ‹
        </button>
        <div className="az-carousel" ref={scrollerRef} tabIndex={0}>
          {listings.map((item) => (
            <ListingCard key={item.slug} item={item} onPreview={onPreview} />
          ))}
        </div>
        <button
          type="button"
          className="az-nav az-nav--next"
          aria-label="Scroll carousel right"
          onClick={() => scrollBy(1)}
        >
          ›
        </button>
        {thumb.visible ? (
          <div className="az-scroll" aria-hidden="true">
            <div
              className="az-scroll-thumb"
              style={{ left: `${thumb.left}%`, width: `${thumb.width}%` }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
