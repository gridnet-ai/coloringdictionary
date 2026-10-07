/**
 * Authoritative shop prices for Stripe Checkout.
 * Keep in sync with src/lib/catalog.ts (priceCents / titles).
 */
export type ShopSku = {
  slug: string;
  name: string;
  priceCents: number;
  imagePath?: string;
};

export const SHOP_CATALOG: Record<string, ShopSku> = {
  'words-and-wonders': {
    slug: 'words-and-wonders',
    name: 'Coloring Dictionary: Words & Wonders',
    priceCents: 1499,
    imagePath: '/assets/cover-words-wonders.jpg',
  },
  'flower-meanings-volume-one': {
    slug: 'flower-meanings-volume-one',
    name: 'Coloring Dictionary: Flower Meanings — Volume One',
    priceCents: 1499,
    imagePath: '/assets/cover-volume-one.png',
  },
  'flower-meanings-christmas': {
    slug: 'flower-meanings-christmas',
    name: 'Coloring Dictionary: Flower Meanings — Christmas',
    priceCents: 1499,
    imagePath: '/assets/cover-christmas.png',
  },
  'flower-meanings-texas': {
    slug: 'flower-meanings-texas',
    name: 'Coloring Dictionary: Flower Meanings — Texas',
    priceCents: 1499,
    imagePath: '/assets/cover-texas.png',
  },
};
