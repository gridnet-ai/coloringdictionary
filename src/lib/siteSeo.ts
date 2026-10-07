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
      faqPageJsonLd(),
    ],
  };
}
