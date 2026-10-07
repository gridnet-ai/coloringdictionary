import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions';

const BUCKET =
  process.env.STORAGE_BUCKET ||
  (process.env.FIREBASE_CONFIG
    ? JSON.parse(process.env.FIREBASE_CONFIG).storageBucket
    : 'coloringdictionary.firebasestorage.app');

/** Named Firestore database for flower meanings / floriography. */
export const FLORIOGRAPHY_DB = 'floriography';
/** Default database holds the word dictionary (+ encyclopedia). */
export const DICTIONARY_DB = '(default)';

function floriographyDb() {
  return getFirestore(FLORIOGRAPHY_DB);
}

function dictionaryDb() {
  return getFirestore(); // (default)
}

function slugId(raw: string) {
  return (
    raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'unknown'
  );
}

/**
 * Import TerryList-mapped flower entries from GCS into the floriography database.
 */
export async function importFloriographyFromGcs(opts?: {
  objectPath?: string;
  maxEntries?: number;
  force?: boolean;
}) {
  const objectPath =
    opts?.objectPath || 'floriography/sources/terrylist-flowers.json';
  const maxEntries = opts?.maxEntries;
  const db = floriographyDb();
  const bucket = getStorage().bucket(BUCKET);
  const file = bucket.file(objectPath);
  const [exists] = await file.exists();
  if (!exists) throw new Error(`Missing GCS object: ${objectPath}`);

  const [buf] = await file.download();
  const flowers = JSON.parse(buf.toString('utf8')) as Array<Record<string, unknown>>;
  if (!Array.isArray(flowers)) throw new Error('Expected flower array JSON');

  const slice = typeof maxEntries === 'number' ? flowers.slice(0, maxEntries) : flowers;
  let written = 0;
  let skippedLocked = 0;
  let batch = db.batch();
  let ops = 0;

  const flush = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for (const flower of slice) {
    const id = String(flower.id || '');
    if (!id) continue;
    const ref = db.collection('entries').doc(id);
    if (!opts?.force) {
      const existing = await ref.get();
      if (existing.exists && existing.data()?.editorialLocked === true) {
        skippedLocked += 1;
        continue;
      }
    }
    batch.set(
      ref,
      {
        ...flower,
        database: FLORIOGRAPHY_DB,
        updatedAt: FieldValue.serverTimestamp(),
        seededAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    written += 1;
    ops += 1;
    if (ops >= 400) await flush();
  }
  await flush();

  // Optional 1884 Greenaway lines
  let dict1884 = 0;
  const histPath = 'floriography/sources/dictionary-1884.json';
  const histFile = bucket.file(histPath);
  const [histExists] = await histFile.exists();
  if (histExists) {
    const [histBuf] = await histFile.download();
    const rows = JSON.parse(histBuf.toString('utf8')) as Array<Record<string, unknown>>;
    if (Array.isArray(rows)) {
      for (const [i, row] of rows.entries()) {
        const name = String(row.historical_name || '').trim();
        if (!name) continue;
        const id = `hist1884_${slugId(name)}_${i}`;
        batch.set(
          db.collection('dictionary1884').doc(id),
          {
            id,
            historicalName: name,
            historicalMeaning1884: row.historical_meaning_1884 || null,
            sourceLine: row.source_line || null,
            source: 'Kate Greenaway Language of Flowers 1884',
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        dict1884 += 1;
        ops += 1;
        if (ops >= 400) await flush();
      }
      await flush();
    }
  }

  await db.collection('meta').doc('floriography').set(
    {
      label: 'Flower Meaning / Floriography',
      databaseId: FLORIOGRAPHY_DB,
      flowerCount: written,
      dictionary1884Count: dict1884,
      source: 'TerryList flowers.json',
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const report = {
    database: FLORIOGRAPHY_DB,
    objectPath,
    written,
    skippedLocked,
    dictionary1884: dict1884,
    scanned: slice.length,
  };
  await db.collection('imports').add({
    type: 'floriography_terrylist',
    ...report,
    createdAt: FieldValue.serverTimestamp(),
  });
  logger.info('Floriography import complete', report);
  return report;
}

/**
 * Ensure "floriography" is defined in the dictionary database (default).
 */
export async function upsertFloriographyDictionaryEntry() {
  const db = dictionaryDb();
  const id = 'dict_floriography';
  const retrievedAt = new Date().toISOString();

  const senses = [
    {
      id: 'sense_floriography_def',
      partOfSpeech: 'noun',
      definition:
        'Floriography is the art and practice of using specific flowers, colors, and arrangements to communicate coded or unspoken messages.',
      definitionSource: 'editorial',
      publicationAdaptation: null,
      examples: [
        'A red rose for passionate love',
        'A yellow rose for friendship (or, traditionally, jealousy)',
        'A white lily for sympathy, purity, and rebirth',
        'A sunflower for adoration, joy, and energy',
      ],
      gapFlags: ['needs_illustration_brief'],
      sourceLayers: [
        {
          provider: 'editorial',
          role: 'primary_definition' as const,
        },
      ],
    },
    {
      id: 'sense_floriography_history',
      partOfSpeech: 'noun',
      definition:
        'History and origins: symbolism using plants dates back thousands of years across Asian, African, and European cultures. Modern floriography traces to selam (the language of flowers) in Ottoman Turkish courts, famously used for secret communication. The practice peaked in 19th-century Victorian England and America, where strict etiquette made open declarations of emotion taboo and people exchanged talking bouquets (nosegays) to share hidden feelings.',
      definitionSource: 'editorial',
      publicationAdaptation: null,
      examples: [
        'Ottoman selam — coded floral messages in court culture',
        'Victorian talking bouquets / nosegays',
      ],
      gapFlags: ['needs_illustration_brief'],
      sourceLayers: [
        {
          provider: 'editorial',
          role: 'primary_definition' as const,
        },
      ],
    },
    {
      id: 'sense_floriography_examples',
      partOfSpeech: 'noun',
      definition:
        'Common flower meanings in floriography include the red rose (passionate love and romance), yellow rose (friendship or, traditionally, jealousy), white lily (sympathy, purity, and rebirth), and sunflower (adoration, joy, and energy).',
      definitionSource: 'editorial',
      publicationAdaptation: null,
      examples: [
        'Red Rose — passionate love and romance',
        'Yellow Rose — friendship or, traditionally, jealousy',
        'White Lily — sympathy, purity, and rebirth',
        'Sunflower — adoration, joy, and energy',
      ],
      gapFlags: ['needs_illustration_brief'],
      sourceLayers: [
        {
          provider: 'editorial',
          role: 'example' as const,
        },
      ],
    },
  ];

  await db.collection('entries').doc(id).set(
    {
      id,
      entryType: 'dictionary',
      lemma: 'floriography',
      language: 'en',
      senses,
      verificationStatus: 'verified',
      editorialLocked: true,
      synthesis: {
        strategy: 'fill_gaps_from_sources',
        primarySource: 'editorial',
        pendingSources: [],
      },
      relatedDatabase: FLORIOGRAPHY_DB,
      relatedDatabaseLabel: 'Flower Meaning / Floriography',
      sources: [
        {
          label: 'Coloring Dictionary editorial',
          attributionRequired: false,
          retrievedAt,
        },
      ],
      provenance: [
        {
          workbook: 'owner-supplied floriography definition',
          importedAt: retrievedAt,
        },
      ],
      updatedAt: FieldValue.serverTimestamp(),
      seededAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  // Companion encyclopedia-style article in dictionary DB for richer pages
  await db.collection('entries').doc('ency_floriography').set(
    {
      id: 'ency_floriography',
      entryType: 'encyclopedia',
      title: 'Floriography',
      slug: 'floriography',
      summary:
        'Floriography is the art and practice of using specific flowers, colors, and arrangements to communicate coded or unspoken messages.',
      body: [
        'Floriography is the art and practice of using specific flowers, colors, and arrangements to communicate coded or unspoken messages.',
        '',
        '## History and Origins',
        '',
        '• Ancient Roots: Symbolism using plants dates back thousands of years across Asian, African, and European cultures.',
        '• The Ottoman Empire: Modern floriography traces back to selam (the language of flowers) in Turkish courts, famously used for secret communication within harems.',
        '• The Victorian Era: The practice peaked in 19th-century England and America, where strict social etiquette made open declarations of emotion taboo. People exchanged "talking bouquets" (or nosegays) to share hidden feelings.',
        '',
        '## Common Examples of Meanings',
        '',
        '• Red Rose: Passionate love and romance.',
        '• Yellow Rose: Friendship or, traditionally, jealousy.',
        '• White Lily: Sympathy, purity, and rebirth.',
        '• Sunflower: Adoration, joy, and energy.',
      ].join('\n'),
      facts: [
        'Also called the language of flowers',
        'Victorian peak: talking bouquets / nosegays',
        'Ottoman precursor: selam',
        'Flower meanings live in the floriography database',
      ],
      relatedEntryIds: ['dict_floriography'],
      verificationStatus: 'verified',
      editorialLocked: true,
      sources: [
        {
          label: 'Coloring Dictionary editorial',
          attributionRequired: false,
          retrievedAt,
        },
      ],
      provenance: [
        {
          workbook: 'owner-supplied floriography definition',
          importedAt: retrievedAt,
        },
      ],
      relatedDatabase: FLORIOGRAPHY_DB,
      updatedAt: FieldValue.serverTimestamp(),
      seededAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return {
    dictionaryDatabase: DICTIONARY_DB,
    dictionaryEntryId: id,
    encyclopediaEntryId: 'ency_floriography',
  };
}
