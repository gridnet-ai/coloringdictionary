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
