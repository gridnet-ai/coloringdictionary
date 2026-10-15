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
  /**
   * Verified Amazon product URL. Leave empty until the listing is live.
   * A URL is shown only together with status `available`.
   */
  amazonUrl: string;
  status: 'available' | 'coming-soon';
  badge?: string;
  format?: string;
  /** One-line promise under the title, used on feature cards. */
  tagline?: string;
  /** How the coloring lines are printed. */
  lineStyle?: string;
  /** Short contrast between editions of the same designs. */
  comparison?: string;
  /** Medium note. Only set when it applies to this edition. */
  materialNote?: string;
  /** Cover description for the feature image. */
  coverAlt?: string;
  /** Spec line for the feature card. */
  specs?: string;
  /**
   * Dedicated homepage feature. These titles stay out of the flower
   * collection and the Amazon carousel.
   */
  feature?: 'line-styles' | 'chill-bro';
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
  /** List price in cents. Defaults to $9.99, or $19.99 for guided journals. */
  priceCents?: number;
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
    amazonUrl: 'https://www.amazon.com/dp/B0HMM597C7',
    status: 'available',
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
  {
    slug: 'chill-bro-hardline',
    series: 'Chill & Bro',
    title: 'Hardline',
    listingTitle: 'Chill & Bro: Hardline',
    subtitle: 'Creative and fun coloring book',
    tagline: 'A little less rush. A little more color.',
    blurb:
      'Bold, smooth black outlines give every Chill & Bro scene a clear boundary. Kick back with animal bros fishing, grilling, camping, and taking a well-earned break. Hardcover, 136 pages, still in review.',
    lineStyle: 'Bold black outlines',
    comparison: 'Bold black boundaries. The outlines stay part of the finished picture.',
    materialNote:
      'When using markers, place a protective sheet underneath your page. Blank reverse sides do not prevent bleed-through.',
    cover: '/assets/chill-bro-hardline-front-cover.jpg',
    coverAlt:
      'Chill and Bro Hardline front cover: a dog, a bear, and a pig around a campfire, with bold black outlines.',
    specs: 'Hardcover · 136 pages · 30 scenes · 30 matching item pages · $19.99',
    amazonUrl: '',
    status: 'coming-soon',
    format: 'Hardcover',
    agesLabel: 'All ages',
    ageFilters: ['all'],
    amazonOnly: true,
    storefront: true,
    feature: 'chill-bro',
    priceCents: 1999,
    keywords: [
      'chill and bro coloring book',
      'coloring book for men',
      'bold black outlines',
      'hardcover coloring book',
    ],
  },
  {
    slug: 'chill-bro-softline',
    series: 'Chill & Bro',
    title: 'Softline',
    listingTitle: 'Chill & Bro: Softline',
    subtitle: 'Creative and fun coloring book',
    tagline: 'Let your colors take the lead.',
    blurb:
      'Thin, light-gray guides for the same Chill & Bro scenes. Explore shading, layering, and blending while your colors define the picture. Hardcover, 136 pages, still in review.',
    lineStyle: 'Thin, light-gray guides',
    comparison: 'Same scenes as Hardline, with light guides instead of bold black boundaries.',
    materialNote:
      'Guide visibility varies by medium. Opaque layers cover gray guides more effectively than transparent markers. When using markers, place a protective sheet underneath your page. Blank reverse sides do not prevent bleed-through.',
    cover: '/assets/chill-bro-softline-front-cover.jpg',
    coverAlt:
      'Chill and Bro Softline front cover: a dog, a bear, and a pig around a campfire, with thin light-gray guides.',
    specs: 'Hardcover · 136 pages · 30 scenes · 30 matching item pages · $19.99',
    amazonUrl: '',
    status: 'coming-soon',
    format: 'Hardcover',
    agesLabel: 'All ages',
    ageFilters: ['all'],
    amazonOnly: true,
    storefront: true,
    feature: 'chill-bro',
    priceCents: 1999,
    keywords: [
      'chill and bro softline',
      'light gray coloring guides',
      'coloring book for men',
      'hardcover coloring book',
    ],
  },
  {
    slug: 'hardline',
    series: 'Coloring Practice',
    title: 'Hardline',
    listingTitle: 'Hardline',
    subtitle: 'A Coloring Practice Book',
    tagline: 'Bold outlines. Clear boundaries.',
    blurb:
      'Bold black outlines give each shape a clear edge. Start with simple objects, explore flowers and their meanings, and relax with Chill & Bro scenes.',
    lineStyle: 'Bold black outlines',
    comparison: 'Clear black boundaries for bold, graphic results.',
    cover: '/assets/hardline-front-cover.webp',
    coverAlt:
      'Hardline front cover, a coloring practice book with bold black outlines and the Coloring Dictionary logo.',
    specs: 'Paperback · 8.5 × 11 inches · 136 pages · 60 coloring designs · $9.99',
    amazonUrl: 'https://www.amazon.com/dp/B0HN34HXGZ',
    status: 'available',
    format: 'Paperback',
    agesLabel: 'All ages',
    ageFilters: ['all'],
    amazonOnly: true,
    storefront: true,
    feature: 'line-styles',
    keywords: [
      'hardline coloring book',
      'bold black outlines',
      'coloring practice book',
    ],
  },
  {
    slug: 'softline',
    series: 'Coloring Practice',
    title: 'Softline',
    listingTitle: 'Softline',
    subtitle: 'A Coloring Practice Book',
    tagline: 'Light guides. More freedom.',
    blurb:
      'Thin, light-gray outlines give your colors more of the spotlight. Explore shading, layering, and blending with simple objects, meaningful flowers, and Chill & Bro scenes.',
    lineStyle: 'Thin, light-gray guides',
    comparison: 'Subtle gray guides for exploring more advanced coloring techniques.',
    materialNote:
      'Line coverage varies by medium. Opaque layers cover guides best; transparent media may leave them visible.',
    cover: '/assets/softline-front-cover.webp',
    coverAlt:
      'Softline front cover, a coloring practice book with thin light-gray guides and the Coloring Dictionary logo.',
    specs: 'Paperback · 8.5 × 11 inches · 136 pages · 60 coloring designs · $9.99',
    amazonUrl: 'https://www.amazon.com/dp/B0HN2ZBLLD',
    status: 'available',
    format: 'Paperback',
    agesLabel: 'All ages',
    ageFilters: ['all'],
    amazonOnly: true,
    storefront: true,
    feature: 'line-styles',
    keywords: [
      'softline coloring book',
      'light gray guides',
      'coloring practice book',
    ],
  },
];

/** Same 60 designs in both line-style editions. */
export const LINE_STYLE_NOTE =
  'Hardline and Softline contain the same 60 designs with different line treatments.';

export const LINE_STYLE_SHARED = [
  '24 shapes and everyday objects',
  '12 flowers with meanings',
  '12 Chill & Bro scenes',
  '12 matching item pages',
  'Short definitions with casual bro humor',
  'Single-sided coloring designs with blank reverse sides',
  'Additional creative-space pages with practice prompts',
] as const;

export const LINE_STYLE_BOOKS = BOOKS.filter((b) => b.feature === 'line-styles');

/** Shop link only when the book is published and a real URL is set. */
export function publishedAmazonUrl(
  book: Pick<BookVolume, 'amazonUrl' | 'status'>,
): string | undefined {
  const url = book.amazonUrl.trim();
  if (book.status === 'available' && url) return url;
  return undefined;
}

function listingFromBook(b: BookVolume): AmazonListingCard {
  const title =
    b.listingTitle ?? `Coloring Dictionary: ${b.series} — ${b.title}`;
  return {
    slug: b.slug,
    title,
    seriesLabel: `Part of: ${b.series}`,
    cover: b.cover,
    amazonUrl:
      publishedAmazonUrl(b) ||
      (b.amazonOnly
        ? ''
        : `https://www.amazon.com/s?k=${encodeURIComponent(`Coloring Dictionary ${b.series} ${b.title}`)}`),
    format: b.format ?? 'Paperback',
    readingAge: b.readingAge,
    ages: b.agesLabel ?? formatReadingAgeLabel(b.readingAge),
    badge: b.status === 'coming-soon' ? 'Coming soon' : b.badge,
    cta: publishedAmazonUrl(b) ? 'Shop on Amazon' : 'Coming soon',
  };
}

function inventoryCard(b: BookVolume): AmazonListingCard {
  const cents = b.priceCents ?? (b.series === 'Guided Journals' ? 1999 : 999);
  return {
    ...listingFromBook(b),
    title:
      b.listingTitle ??
      (b.series === 'Flower Meanings' ? `${b.series}: ${b.title}` : b.title),
    kind: b.series === 'Guided Journals' ? 'Guided Journals' : 'Coloring Book',
    price: {
      whole: String(Math.floor(cents / 100)),
      frac: String(cents % 100).padStart(2, '0'),
    },
  };
}

const STOREFRONT_BOOKS = BOOKS.filter((b) => b.storefront);
const LEAD_INVENTORY = STOREFRONT_BOOKS.filter(
  (b) => b.feature === 'chill-bro' || b.feature === 'line-styles',
);
const REST_INVENTORY = STOREFRONT_BOOKS.filter(
  (b) => b.feature !== 'chill-bro' && b.feature !== 'line-styles',
);

/** Homepage grid of titles people can shop now. */
export const HERO_LISTINGS: AmazonListingCard[] = [
  ...LEAD_INVENTORY.map(inventoryCard),
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
  ...REST_INVENTORY.map(inventoryCard),
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
  ...BOOKS.filter(
    (b) => b.feature === 'line-styles' && b.status === 'available',
  ).map(listingFromBook),
  ...BOOKS.filter(
    (b) => b.feature !== 'line-styles' && b.feature !== 'chill-bro',
  ).map(listingFromBook),
];

