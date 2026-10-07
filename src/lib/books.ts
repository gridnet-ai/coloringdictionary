export type BookVolume = {
  slug: string;
  series: string;
  title: string;
  subtitle: string;
  blurb: string;
  cover: string;
  /** Set the real Amazon product URL when live; empty shows “Coming soon on Amazon”. */
  amazonUrl: string;
  status: 'available' | 'coming-soon';
  badge?: string;
};

export type AmazonListingCard = {
  slug: string;
  title: string;
  seriesLabel?: string;
  cover: string;
  amazonUrl: string;
  format: string;
  ages?: string;
  badge?: string;
  /** Omit until real ratings exist — do not invent review counts. */
  rating?: string;
  reviewCount?: string;
  price?: { whole: string; frac: string };
  listPrice?: string;
  cta?: string;
};

/**
 * Flagship Amazon listing shown in the homepage hero.
 * Replace `amazonUrl` with the live ASIN/product URL when you have it.
 */
export const FLAGSHIP_LISTING = {
  slug: 'words-and-wonders',
  series: 'Coloring Dictionary',
  title: 'Coloring Dictionary: Words & Wonders',
  shortTitle: 'Words & Wonders',
  tagline: 'A dictionary that you can color.',
  seriesLabel: 'Part of: Coloring Dictionary',
  format: 'Paperback',
  ages: 'All ages',
  cover: '/assets/cover-words-wonders.jpg',
  amazonUrl:
    'https://www.amazon.com/s?k=Coloring+Dictionary+Words+and+Wonders',
  cta: 'Buy on Amazon',
  badge: 'For All Ages',
} as const;

/** Flower Meanings series — add new volumes here. */
export const BOOKS: BookVolume[] = [
  {
    slug: 'flower-meanings-volume-one',
    series: 'Flower Meanings',
    title: 'Volume One',
    subtitle: 'Our first chapter',
    blurb:
      'Explore the messages people have given flowers — from cheerful coreopsis to a clover that says “Think of me.”',
    cover: '/assets/cover-volume-one.png',
    amazonUrl: '',
    status: 'coming-soon',
    badge: 'First collection',
  },
  {
    slug: 'flower-meanings-christmas',
    series: 'Flower Meanings',
    title: 'Christmas',
    subtitle: 'Holiday flowers',
    blurb:
      'A seasonal volume of winter blooms and evergreen favorites — color the season’s meanings.',
    cover: '/assets/cover-christmas.png',
    amazonUrl: '',
    status: 'coming-soon',
    badge: 'Seasonal',
  },
  {
    slug: 'flower-meanings-texas',
    series: 'Flower Meanings',
    title: 'Texas',
    subtitle: 'Wildflowers',
    blurb:
      'Bluebonnets, paintbrush, and more — a Texas wildflower edition of meanings you can color.',
    cover: '/assets/cover-texas.png',
    amazonUrl: '',
    status: 'coming-soon',
    badge: 'Regional',
  },
];

/** Amazon-style carousel cards (after hero). */
export const CAROUSEL_LISTINGS: AmazonListingCard[] = [
  {
    slug: FLAGSHIP_LISTING.slug,
    title: FLAGSHIP_LISTING.title,
    seriesLabel: FLAGSHIP_LISTING.seriesLabel,
    cover: FLAGSHIP_LISTING.cover,
    amazonUrl: FLAGSHIP_LISTING.amazonUrl,
    format: FLAGSHIP_LISTING.format,
    ages: FLAGSHIP_LISTING.ages,
    badge: 'New',
    cta: 'Buy on Amazon',
  },
  ...BOOKS.map(
    (b): AmazonListingCard => ({
      slug: b.slug,
      title: `Coloring Dictionary: ${b.series} — ${b.title}`,
      seriesLabel: `Part of: ${b.series}`,
      cover: b.cover,
      amazonUrl:
        b.amazonUrl ||
        `https://www.amazon.com/s?k=${encodeURIComponent(`Coloring Dictionary ${b.series} ${b.title}`)}`,
      format: 'Paperback',
      ages: 'All ages',
      badge: b.status === 'coming-soon' ? 'Coming soon' : undefined,
      cta: b.status === 'coming-soon' ? 'View on Amazon' : 'Buy on Amazon',
    }),
  ),
];
