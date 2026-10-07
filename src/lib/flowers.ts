export type FlowerEntry = {
  slug: string;
  number: string;
  name: string;
  scientificName: string;
  meaning: string;
  phrase: string;
  highlight: string;
  facts: string[];
  colors: { label: string; note: string }[];
  image: string;
  caption: string;
};

export const FLOWERS: FlowerEntry[] = [
  {
    slug: 'coreopsis',
    number: '01',
    name: 'Coreopsis',
    scientificName: 'Coreopsis spp.',
    meaning: 'Always cheerful.',
    phrase: 'You bring sunshine to my day.',
    highlight: 'You bring sunshine to my day.',
    facts: [
      'Bright daisy-like blooms often appear in summer gardens.',
      'Petals may be solid gold or marked with burgundy near the center.',
      'Gardeners prize coreopsis for long-lasting color.',
    ],
    colors: [
      { label: 'Golden yellow', note: 'Classic sunny petals.' },
      { label: 'Bicolor', note: 'Gold with deep red near the eye.' },
    ],
    image: '/assets/flower-coreopsis.svg',
    caption: 'Natural colors are a guide. Your colors are your choice.',
  },
  {
    slug: 'pink-carnation',
    number: '02',
    name: 'Pink Carnation',
    scientificName: 'Dianthus caryophyllus',
    meaning: 'I’ll never forget you.',
    phrase: 'I will always remember you.',
    highlight: 'I will always remember you.',
    facts: [
      'Carnations have been cultivated for centuries.',
      'Ruffled petals stack in dense, fragrant blooms.',
      'Pink shades often signal remembrance and affection.',
    ],
    colors: [
      { label: 'Light pink', note: 'Soft, delicate petals.' },
      { label: 'Deep pink', note: 'Richer tones toward the center.' },
    ],
    image: '/assets/flower-pink-carnation.svg',
    caption: 'Natural colors are a guide. Your colors are your choice.',
  },
  {
    slug: 'white-clover',
    number: '03',
    name: 'White Clover',
    scientificName: 'Trifolium repens',
    meaning: 'Think of me.',
    phrase: 'Keep me in your thoughts.',
    highlight: 'Keep me in your thoughts.',
    facts: [
      'Each round flower head holds many tiny flowers.',
      'Its leaves usually have three leaflets.',
      'Bees visit white clover flowers.',
    ],
    colors: [
      { label: 'Creamy white', note: 'Typical flower head.' },
      { label: 'A hint of pink', note: 'Sometimes appears on blooms.' },
    ],
    image: '/assets/flower-white-clover.svg',
    caption: 'Green leaves often have pale markings.',
  },
];

export function getFlower(slug: string): FlowerEntry | undefined {
  return FLOWERS.find((f) => f.slug === slug);
}
