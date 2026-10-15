import {
  COLORING_DICTIONARY_BRAND,
  SITE_ORIGIN,
} from '@/lib/coloringDictionaryBrand';

export const SITE_NAME = COLORING_DICTIONARY_BRAND.name;
export const SITE_TAGLINE = `${SITE_NAME} — ${COLORING_DICTIONARY_BRAND.tagline}`;
export const SITE_SUBHEADLINE =
  'Explore flower meanings with a colored guide on the left and a page to make your own on the right. Preview Volume One, in production.';

export const DEFAULT_KEYWORDS = [
  'Coloring Dictionary',
  'flower meanings',
  'coloring book',
  'flower symbolism',
  'botanical coloring',
  'White Clover',
  'Coreopsis',
  'Pink Carnation',
  'dictionary you can color',
  'Color Learn Grow',
  'educational coloring',
].join(', ');

export const DEFAULT_ROBOTS =
  'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

export const FAQS = [
  {
    question: 'What is Coloring Dictionary?',
    answer:
      'Coloring Dictionary is a publishing brand that pairs readable explanations and colored examples with facing illustrations to color. Flower Meanings is its first collection.',
  },
  {
    question: 'How does the two-page format work?',
    answer:
      'The English edition places the guide on the left and the coloring illustration on the right, so you can refer to the example while coloring.',
  },
  {
    question: 'Do I have to use the natural flower colors?',
    answer: 'No. Natural colors are a guide. Your colors are your choice.',
  },
  {
    question: 'Is Flower Meanings: Volume One available to buy?',
    answer:
      'Not yet. Volume One is in production. The images on this website show draft pages and a concept mockup.',
  },
  {
    question: 'Are flower meanings the same everywhere?',
    answer:
      'No. Flower meanings can differ across cultures, historical periods and dictionaries. This collection shares selected associations with sources.',
  },
  {
    question: 'Will there be other subjects or languages?',
    answer:
      'Other subjects and language editions are part of the expansion plans. They are not available products yet.',
  },
] as const;

export function organizationJsonLd() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_ORIGIN}/#organization`,
    name: SITE_NAME,
    url: `${SITE_ORIGIN}/`,
    logo: {
      '@type': 'ImageObject',
      url: COLORING_DICTIONARY_BRAND.icon,
    },
    description: COLORING_DICTIONARY_BRAND.description,
  };
}

export function websiteJsonLd() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_ORIGIN}/#website`,
    url: `${SITE_ORIGIN}/`,
    name: SITE_NAME,
    publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    inLanguage: 'en',
  };
}

export function webPageJsonLd() {
  return {
    '@type': 'WebPage',
    '@id': `${SITE_ORIGIN}/#webpage`,
    url: `${SITE_ORIGIN}/`,
    name: SITE_TAGLINE,
    description: SITE_SUBHEADLINE,
    isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
    about: { '@id': `${SITE_ORIGIN}/#flower-meanings` },
    inLanguage: 'en',
  };
}

export function bookJsonLd() {
  return {
    '@type': 'CreativeWork',
    '@id': `${SITE_ORIGIN}/#flower-meanings`,
    name: 'Coloring Dictionary: Flower Meanings — Volume One',
    creativeWorkStatus: 'In development',
    description:
      'A planned flower-meaning coloring dictionary with facing guide and coloring pages. Current images are draft concepts.',
    publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    inLanguage: 'en',
  };
}

/** Hardline and Softline are submitted to KDP and are not for sale yet. */
export function lineStyleBooksJsonLd() {
  const shared =
    'Submitted to Amazon KDP and awaiting review. Not for sale. Same 60 designs as the other line-style edition.';
  return [
    {
      '@type': 'Book',
      '@id': `${SITE_ORIGIN}/#hardline`,
      name: 'Hardline',
      alternateName: 'A Coloring Practice Book',
      bookFormat: 'https://schema.org/Paperback',
      numberOfPages: 136,
      inLanguage: 'en',
      creativeWorkStatus: shared,
      description:
        'A coloring practice book with bold black outlines. Paperback, 8.5 × 11 inches, 136 pages, 60 coloring designs.',
      image: `${SITE_ORIGIN}/assets/hardline-front-cover.webp`,
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    },
    {
      '@type': 'Book',
      '@id': `${SITE_ORIGIN}/#softline`,
      name: 'Softline',
      alternateName: 'A Coloring Practice Book',
      bookFormat: 'https://schema.org/Paperback',
      numberOfPages: 136,
      inLanguage: 'en',
      creativeWorkStatus: shared,
      description:
        'A coloring practice book with thin, light-gray guides. Paperback, 8.5 × 11 inches, 136 pages, 60 coloring designs. Opaque layers cover the guides best; transparent media may leave them visible.',
      image: `${SITE_ORIGIN}/assets/softline-front-cover.webp`,
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    },
    {
      '@type': 'Book',
      '@id': `${SITE_ORIGIN}/#chill-bro-hardline`,
      name: 'Chill & Bro: Hardline',
      alternateName: 'Creative and fun coloring book',
      bookFormat: 'https://schema.org/Hardcover',
      numberOfPages: 136,
      inLanguage: 'en',
      creativeWorkStatus:
        'Submitted to Amazon KDP and awaiting review. Not for sale.',
      description:
        'A hardcover coloring book with bold black outlines. 136 pages, 30 Chill & Bro scenes and 30 matching item pages. Listed at $19.99 and not yet for sale.',
      image: `${SITE_ORIGIN}/assets/chill-bro-hardline-front-cover.jpg`,
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    },
    {
      '@type': 'Book',
      '@id': `${SITE_ORIGIN}/#chill-bro-softline`,
      name: 'Chill & Bro: Softline',
      alternateName: 'Creative and fun coloring book',
      bookFormat: 'https://schema.org/Hardcover',
      numberOfPages: 136,
      inLanguage: 'en',
      creativeWorkStatus:
        'Submitted to Amazon KDP and awaiting review. Not for sale.',
      description:
        'A hardcover coloring book with thin, light-gray guides and the same scenes as Chill & Bro: Hardline. 136 pages. Listed at $19.99 and not yet for sale. Opaque layers cover the guides best.',
      image: `${SITE_ORIGIN}/assets/chill-bro-softline-front-cover.jpg`,
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    },
  ];
}

export function faqPageJsonLd(
  faqs: readonly { question: string; answer: string }[] = FAQS,
) {
  return {
    '@type': 'FAQPage',
    '@id': `${SITE_ORIGIN}/#faq`,
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function homePageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationJsonLd(),
      websiteJsonLd(),
      webPageJsonLd(),
      bookJsonLd(),
      ...lineStyleBooksJsonLd(),
      faqPageJsonLd(),
    ],
  };
}
