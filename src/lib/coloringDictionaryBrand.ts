export const SITE_ORIGIN =
  (import.meta.env.VITE_SITE_ORIGIN as string | undefined)?.replace(/\/$/, '') ||
  'https://coloringdictionary.com';

export const SOURCE_REGISTRY =
  (import.meta.env.VITE_SOURCE_REGISTRY as string | undefined) || 'coloringdictionary';

export const IRL_SLUG =
  (import.meta.env.VITE_IRL_SLUG as string | undefined) || 'coloring-dictionary';

export const COLORING_DICTIONARY_BRAND = {
  name: 'Coloring Dictionary',
  tagline: 'A dictionary you can color.',
  motto: 'Color • Learn • Grow',
  domain: 'coloringdictionary.com',
  url: `${SITE_ORIGIN}/`,
  description:
    'A publishing brand that pairs readable explanations and colored examples with facing illustrations to color. Flower Meanings is its first collection.',
  shortDescription:
    'Explore a subject through clear explanations, colored examples and illustrations you make your own.',
  palette: {
    teal: '#00505A',
    night: '#082F35',
    cream: '#FFF5DB',
    gold: '#FFC629',
    ink: '#202A2D',
    paper: '#FAF8F0',
  },
  logo: `${SITE_ORIGIN}/assets/logo-header.png`,
  icon: `${SITE_ORIGIN}/icons/icon-512.png`,
  ogImage: `${SITE_ORIGIN}/assets/og-image.png`,
} as const;
