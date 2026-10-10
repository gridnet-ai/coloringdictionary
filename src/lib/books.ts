import {
  formatReadingAgeLabel,
  type AgeGroupId,
  type ReadingAge,
} from '@/lib/ageGroups';

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
  format?: string;
  /** Full title on cards. Defaults to “Coloring Dictionary: {series} — {title}”. */
  listingTitle?: string;
  /** Audience line when it is not a children’s reading-age range. */
  agesLabel?: string;
  /**
   * Shop age chips this title belongs on.
   * Omit for a general-audience book (it stays in every band).
   */
  ageFilters?: AgeGroupId[];
  /** Sold on Amazon only — no site price and no cart. */
  amazonOnly?: boolean;
  keywords?: string[];
  /** Show in the homepage Amazon inventory grid. */
  storefront?: boolean;
  /**
   * KDP reading-age min–max. Leave unset for general-audience titles
   * (site “All ages”); set a range when targeting children’s/teen categories.
   */
  readingAge?: ReadingAge;
};

export type AmazonListingCard = {
  slug: string;
  title: string;
  seriesLabel?: string;
  cover: string;
  amazonUrl: string;
  format: string;
  /** What the book is, shown on the inventory card. */
  kind?: string;
  ages?: string;
  readingAge?: ReadingAge;
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
 * Everyday Things, Book 0000001 — ASIN B0HMGGT5XS.
 */
export const FLAGSHIP_LISTING = {
  slug: 'words-and-wonders',
  series: 'Coloring Dictionary',
  title: 'Coloring Dictionary: Everyday Things, Book 0000001',
  shortTitle: 'Everyday Things',
  tagline: 'A dictionary that you can color.',
  seriesLabel: 'Part of: Coloring Dictionary',
  format: 'Paperback',
  ages: 'All ages',
  cover: '/assets/cover-everyday-things.jpg?v=3',
  amazonUrl: 'https://www.amazon.com/dp/B0HMGGT5XS',
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
    amazonUrl: 'https://www.amazon.com/dp/B0HMGMM6Z7',
    status: 'available',
    badge: 'Seasonal',
    storefront: true,
  },
  {
    slug: 'my-lucky-year',
    series: 'Guided Journals',
    title: 'My Lucky Year',
    listingTitle:
      'My Lucky Year: A Journal for Gratitude, Reflection, Hope & New Beginnings',
    subtitle: 'Gratitude, reflection, hope, and new beginnings',
    blurb:
      'An undated hardcover journal for gratitude, reflection, hope, and new beginnings. Write your own year, whenever you are ready.',
    cover: '/assets/cover-my-lucky-year.jpg',
    amazonUrl: 'https://www.amazon.com/dp/B0HMMLHY79',
    status: 'available',
    badge: 'Journal',
    format: 'Hardcover',
    agesLabel: 'Young adult and adult',
    ageFilters: ['13-17'],
    readingAge: { min: 13, max: 17 },
    amazonOnly: true,
    storefront: true,
    keywords: [
      'undated gratitude journal hardcover',
      'personal reflection journal for adults',
      'journal for new beginnings',
      'yearly memory keepsake journal',
      'family traditions writing journal',
      'mindfulness and hope journal',
      'thoughtful journal gift',
    ],
  },
  {
    slug: 'our-lucky-year',
    series: 'Guided Journals',
    title: 'Our Lucky Year',
    listingTitle: 'Our Lucky Year',
    subtitle: 'A couples journal',
    blurb:
      'A couples journal for gratitude, shared dreams, and the year you spend together. Undated, so you can begin whenever you are ready.',
    cover: '/assets/cover-our-lucky-year.jpg',
    amazonUrl: '',
    status: 'coming-soon',
    badge: 'Journal',
    format: 'Hardcover',
    agesLabel: 'Young adult and adult',
    ageFilters: ['13-17'],
    readingAge: { min: 13, max: 17 },
    amazonOnly: true,
    storefront: true,
    keywords: [
      'couples journal hardcover',
      'relationship journal for couples',
      'couples gratitude journal',
      'anniversary keepsake journal',
      'shared dreams and goals journal',
      'romantic journal gift for couples',
      'undated couples memory book',
    ],
  },
  {
    slug: 'hip-hop',
    series: 'Coloring Dictionary',
    title: 'Hip Hop',
    listingTitle: 'Coloring Dictionary: Hip Hop',
    subtitle: 'A dictionary that you can color.',
    blurb:
      'Sixty-one hip-hop words with simple definitions, example sentences, and pictures to color. Includes a mural activity and space to write your own verse.',
    cover: '/assets/cover-hip-hop.jpg',
    amazonUrl: '',
    status: 'coming-soon',
    format: 'Paperback',
    agesLabel: 'Ages 6–12',
    ageFilters: ['6-8', '9-12'],
    readingAge: { min: 6, max: 12 },
    amazonOnly: true,
    storefront: true,
    keywords: [
      'music vocabulary activities for kids',
      'rap culture educational activity book',
      'dj turntables beat making',
      'breakdance popping locking',
      'graffiti mural art activities',
      'black culture family learning',
      'creative classroom music activities',
    ],
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

function listingFromBook(b: BookVolume): AmazonListingCard {
  const title =
    b.listingTitle ?? `Coloring Dictionary: ${b.series} — ${b.title}`;
  return {
    slug: b.slug,
    title,
    seriesLabel: `Part of: ${b.series}`,
    cover: b.cover,
    amazonUrl:
      b.amazonUrl ||
      (b.amazonOnly
        ? ''
        : `https://www.amazon.com/s?k=${encodeURIComponent(`Coloring Dictionary ${b.series} ${b.title}`)}`),
    format: b.format ?? 'Paperback',
    readingAge: b.readingAge,
    ages: b.agesLabel ?? formatReadingAgeLabel(b.readingAge),
    badge: b.status === 'coming-soon' ? 'Coming soon' : b.badge,
    cta: b.amazonUrl ? 'Buy on Amazon' : 'Coming soon',
  };
}

/** Homepage grid of titles people can shop now. */
export const HERO_LISTINGS: AmazonListingCard[] = [
  {
    slug: FLAGSHIP_LISTING.slug,
    title: FLAGSHIP_LISTING.shortTitle,
    seriesLabel: FLAGSHIP_LISTING.seriesLabel,
    cover: FLAGSHIP_LISTING.cover,
    amazonUrl: FLAGSHIP_LISTING.amazonUrl,
    format: FLAGSHIP_LISTING.format,
    ages: FLAGSHIP_LISTING.ages,
    badge: FLAGSHIP_LISTING.badge,
    cta: FLAGSHIP_LISTING.cta,
    kind: 'Coloring Book',
    price: { whole: '9', frac: '99' },
  },
  ...BOOKS.filter((b) => b.storefront).map((b) => {
    const journal = b.series === 'Guided Journals';
    return {
      ...listingFromBook(b),
      title: b.series === 'Flower Meanings' ? `${b.series}: ${b.title}` : b.title,
      kind: journal ? 'Guided Journals' : 'Coloring Book',
      price: journal ? { whole: '19', frac: '99' } : { whole: '9', frac: '99' },
    };
  }),
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
  ...BOOKS.map(listingFromBook),
];

