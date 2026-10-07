import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions';

const BUCKET =
  process.env.STORAGE_BUCKET ||
  (process.env.FIREBASE_CONFIG
    ? JSON.parse(process.env.FIREBASE_CONFIG).storageBucket
    : 'coloringdictionary.firebasestorage.app');

/** Named Firestore DB for the Kaikki/Wiktionary English word catalogue. */
export const ENGLISH_WORDS_DB = 'englishwords';
/** Default DB — universal dictionary registry + encyclopedia. */
export const DICTIONARY_DB = '(default)';

const SHEET_ID = '1vrMpdBc0oyDI2_VN15TityjvqevJU6q2SQEJPeTrLcQ';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?usp=sharing`;

const TAB_COUNTS: { id: string; entries: number }[] = [
  { id: 'A', entries: 88494 },
  { id: 'B', entries: 95117 },
  { id: 'C', entries: 126391 },
  { id: 'D', entries: 76612 },
  { id: 'E', entries: 48495 },
  { id: 'F', entries: 55840 },
  { id: 'G', entries: 55933 },
  { id: 'H', entries: 64811 },
  { id: 'I', entries: 40050 },
  { id: 'J', entries: 14607 },
  { id: 'K', entries: 28403 },
  { id: 'L', entries: 49633 },
  { id: 'M', entries: 97254 },
  { id: 'N', entries: 50480 },
  { id: 'O', entries: 40089 },
  { id: 'P', entries: 122853 },
  { id: 'Q', entries: 8121 },
  { id: 'R', entries: 67073 },
  { id: 'S', entries: 156457 },
  { id: 'T', entries: 80710 },
  { id: 'U', entries: 40497 },
  { id: 'V', entries: 20319 },
  { id: 'W', entries: 38422 },
  { id: 'X', entries: 2854 },
  { id: 'Y', entries: 8130 },
  { id: 'Z', entries: 7264 },
  { id: '#', entries: 6593 },
];

function englishWordsDb() {
  return getFirestore(ENGLISH_WORDS_DB);
}

function dictionaryDb() {
  return getFirestore();
}

/**
 * Register the English Word Database in its own Firestore DB + the universal
 * dictionarySources registry. Uploads README to GCS when provided as text/path.
 */
export async function registerEnglishWordDatabase(opts?: {
  readmeText?: string;
  force?: boolean;
}) {
  const ew = englishWordsDb();
  const dict = dictionaryDb();
  const bucket = getStorage().bucket(BUCKET);
  const readmePath = 'englishwords/sources/README.csv';
  const manifestPath = 'englishwords/sources/manifest.json';

  const manifest = {
    database: ENGLISH_WORDS_DB,
    databaseLabel: 'English Word Database',
    source: 'kaikki.org machine-readable English dictionary (Wiktionary)',
    extracted: '2026-10-03',
    dump: 'enwiktionary 2026-09-02',
    pulled: '2026-10-07',
    license:
      'CC BY-SA (Wiktionary) — credit Wiktionary contributors if definitions are published',
    googleSheetUrl: SHEET_URL,
    googleSheetId: SHEET_ID,
    readmeObjectPath: readmePath,
    totalEntries: 1491502,
    tabs: TAB_COUNTS,
  };

  if (opts?.readmeText) {
    await bucket.file(readmePath).save(opts.readmeText, {
      contentType: 'text/csv; charset=utf-8',
      resumable: false,
      metadata: {
        cacheControl: 'public, max-age=300',
      },
    });
  }

  await bucket.file(manifestPath).save(JSON.stringify(manifest, null, 2), {
    contentType: 'application/json; charset=utf-8',
    resumable: false,
  });

  await ew.collection('meta').doc('readme').set(
    {
      title: 'Coloring Dictionary — English Word Database',
      ...manifest,
      gcsReadme: `gs://${BUCKET}/${readmePath}`,
      gcsManifest: `gs://${BUCKET}/${manifestPath}`,
      howToUse: [
        'One row per dictionary entry (word + part of speech).',
        'Tabs split entries by first letter; # holds non-letter starts.',
        'Filter Note to hide inflected/variant forms when picking headwords.',
        'Topics (Wiktionary categories) help themed volumes.',
      ],
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  let tabsWritten = 0;
  let batch = ew.batch();
  let ops = 0;
  for (const tab of TAB_COUNTS) {
    const id = tab.id === '#' ? 'hash' : tab.id.toLowerCase();
    batch.set(
      ew.collection('tabs').doc(id),
      {
        label: tab.id,
        entries: tab.entries,
        sheetId: SHEET_ID,
        googleSheetUrl: SHEET_URL,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    ops += 1;
    tabsWritten += 1;
    if (ops >= 400) {
      await batch.commit();
      batch = ew.batch();
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();

  // Universal dictionary registry (default DB)
  await dict.collection('dictionarySources').doc('english-word-database').set(
    {
      id: 'english-word-database',
      label: 'English Word Database (Kaikki / Wiktionary sheet)',
      path: readmePath,
      bucket: BUCKET,
      gcsUri: `gs://${BUCKET}/${readmePath}`,
      storage: 'gcs',
      namedDatabase: ENGLISH_WORDS_DB,
      license: manifest.license,
      url: SHEET_URL,
      googleSheetId: SHEET_ID,
      totalEntries: manifest.totalEntries,
      note: 'Own Firestore database englishwords; sheet is the working catalogue for book headwords.',
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await ew.collection('imports').doc(`register-${Date.now()}`).set({
    kind: 'register',
    tabsWritten,
    force: Boolean(opts?.force),
    createdAt: FieldValue.serverTimestamp(),
  });

  logger.info('English Word Database registered', {
    database: ENGLISH_WORDS_DB,
    tabsWritten,
    totalEntries: manifest.totalEntries,
  });

  return {
    database: ENGLISH_WORDS_DB,
    tabsWritten,
    totalEntries: manifest.totalEntries,
    googleSheetUrl: SHEET_URL,
    gcsReadme: `gs://${BUCKET}/${readmePath}`,
    gcsManifest: `gs://${BUCKET}/${manifestPath}`,
  };
}

/**
 * Import a letter-tab CSV already stored in GCS into englishwords/entries.
 * Expected header includes at least Word; optional POS, Note, Topics, Definition.
 */
export async function importEnglishWordsCsvFromGcs(opts: {
  objectPath: string;
  tab?: string;
  maxEntries?: number;
  skipExisting?: boolean;
}) {
  const db = englishWordsDb();
  const bucket = getStorage().bucket(BUCKET);
  const file = bucket.file(opts.objectPath);
  const [exists] = await file.exists();
  if (!exists) throw new Error(`Missing GCS object: ${opts.objectPath}`);

  const [buf] = await file.download();
  const text = buf.toString('utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) throw new Error('CSV has no data rows');

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const wordIdx = headers.findIndex((h) => h === 'word' || h === 'headword');
  if (wordIdx < 0) throw new Error('CSV missing Word column');
  const posIdx = headers.findIndex(
    (h) => h === 'pos' || h === 'part of speech' || h === 'part_of_speech',
  );
  const noteIdx = headers.findIndex((h) => h === 'note' || h === 'notes');
  const topicsIdx = headers.findIndex(
    (h) => h === 'topics' || h === 'topic' || h === 'categories',
  );
  const defIdx = headers.findIndex(
    (h) => h === 'definition' || h === 'gloss' || h === 'sense',
  );

  const max =
    typeof opts.maxEntries === 'number' ? opts.maxEntries : Number.POSITIVE_INFINITY;
  let written = 0;
  let skipped = 0;
  let scanned = 0;
  let batch = db.batch();
  let ops = 0;

  const flush = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for (let i = 1; i < lines.length && written < max; i++) {
    const cols = parseCsvLine(lines[i]);
    const word = (cols[wordIdx] || '').trim();
    if (!word) continue;
    scanned += 1;
    const pos = posIdx >= 0 ? (cols[posIdx] || '').trim() : '';
    const id = entryId(word, pos);
    const ref = db.collection('entries').doc(id);
    if (opts.skipExisting) {
      const existing = await ref.get();
      if (existing.exists) {
        skipped += 1;
        continue;
      }
    }
    const doc: Record<string, unknown> = {
      word,
      wordLower: word.toLowerCase(),
      pos: pos || null,
      tab: opts.tab || letterTab(word),
      source: 'english-word-database',
      googleSheetId: SHEET_ID,
      gcsObject: opts.objectPath,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (noteIdx >= 0 && cols[noteIdx]) doc.note = cols[noteIdx].trim();
    if (topicsIdx >= 0 && cols[topicsIdx]) {
      doc.topics = cols[topicsIdx]
        .split(/[;,|]/)
        .map((t) => t.trim())
        .filter(Boolean);
    }
    if (defIdx >= 0 && cols[defIdx]) doc.definition = cols[defIdx].trim();

    batch.set(ref, doc, { merge: true });
    ops += 1;
    written += 1;
    if (ops >= 400) await flush();
  }
  await flush();

  await db.collection('imports').add({
    kind: 'csv',
    objectPath: opts.objectPath,
    tab: opts.tab || null,
    scanned,
    written,
    skipped,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { scanned, written, skipped, objectPath: opts.objectPath };
}

function entryId(word: string, pos: string) {
  const base = `${word}__${pos || 'unknown'}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180);
  return base || `row-${Math.random().toString(36).slice(2, 10)}`;
}

function letterTab(word: string) {
  const ch = word.trim().charAt(0).toUpperCase();
  if (ch >= 'A' && ch <= 'Z') return ch;
  return '#';
}

/** Minimal CSV line parser (handles quoted commas). */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}
