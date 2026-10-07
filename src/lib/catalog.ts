import {
  formatReadingAgeLabel,
  type AgeGroupId,
  type ReadingAge,
} from '@/lib/ageGroups';
import { BOOKS, FLAGSHIP_LISTING } from '@/lib/books';

/** Storefront product — Amazon listings plus direct Stripe checkout. */
export type CatalogProduct = {
  slug: string;
  title: string;
  seriesLabel: string;
  cover: string;
  format: string;
  amazonUrl: string;
  /** Display price (USD). Authoritative amount for Stripe lives on the server too. */
  priceCents: number;
  listPriceCents?: number;
  badge?: string;
  blurb?: string;
  readingAge?: ReadingAge;
  /**
   * Which age browse chips this title appears under.
   * Include `all` for general-audience titles (they also show in every band).
   * Add specific bands when a book is positioned for those readers too.
   */
  ageFilters: AgeGroupId[];
  status: 'available' | 'coming-soon';
};

function ageFiltersFor(
  readingAge: ReadingAge | undefined,
  extra: AgeGroupId[] = [],
): AgeGroupId[] {
  const set = new Set<AgeGroupId>(['all', ...extra]);
  if (!readingAge || (readingAge.min == null && readingAge.max == null)) {
    return [...set];
  }
  const min = readingAge.min ?? readingAge.max ?? 0;
  const max = readingAge.max ?? readingAge.min ?? min;
  const bands: AgeGroupId[] = ['0-2', '3-5', '6-8', '9-12', '13-17'];
  for (const id of bands) {
    const [a, b] = id.split('-').map(Number);
    if (min <= b && max >= a) set.add(id);
  }
  return [...set];
}

/** All Amazon / series listings available in the shop catalogue. */
export const CATALOG: CatalogProduct[] = [
  {
    slug: FLAGSHIP_LISTING.slug,
    title: FLAGSHIP_LISTING.title,
    seriesLabel: FLAGSHIP_LISTING.seriesLabel,
    cover: FLAGSHIP_LISTING.cover,
    format: FLAGSHIP_LISTING.format,
    amazonUrl: FLAGSHIP_LISTING.amazonUrl,
    priceCents: 1499,
    badge: FLAGSHIP_LISTING.badge,
    blurb: FLAGSHIP_LISTING.tagline,
    ageFilters: ageFiltersFor(undefined),
    status: 'available',
  },
  ...BOOKS.map((b): CatalogProduct => {
    const readingAge = b.readingAge;
    return {
      slug: b.slug,
      title: `Coloring Dictionary: ${b.series} — ${b.title}`,
      seriesLabel: `Part of: ${b.series}`,
      cover: b.cover,
      format: 'Paperback',
      amazonUrl:
        b.amazonUrl ||
        `https://www.amazon.com/s?k=${encodeURIComponent(`Coloring Dictionary ${b.series} ${b.title}`)}`,
      priceCents: 1499,
      badge: b.badge,
      blurb: b.blurb,
      readingAge,
      ageFilters: ageFiltersFor(readingAge),
      status: b.status,
    };
  }),
];

export function getCatalogProduct(slug: string): CatalogProduct | undefined {
  return CATALOG.find((p) => p.slug === slug);
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function catalogAgeLabel(product: CatalogProduct): string {
  return formatReadingAgeLabel(product.readingAge);
}

