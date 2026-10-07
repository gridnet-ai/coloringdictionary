import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions';
import { createGunzip } from 'zlib';
import { Readable, pipeline } from 'stream';
import { promisify } from 'util';
import * as readline from 'readline';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createHash } from 'crypto';
import AdmZip from 'adm-zip';

const pipe = promisify(pipeline);

const BUCKET =
  process.env.STORAGE_BUCKET ||
  (process.env.FIREBASE_CONFIG
    ? JSON.parse(process.env.FIREBASE_CONFIG).storageBucket
    : 'coloringdictionary.firebasestorage.app');

const POS_LABEL: Record<string, string> = {
  n: 'noun',
  v: 'verb',
  a: 'adjective',
  s: 'adjective',
  r: 'adverb',
};

function slugLemma(lemma: string) {
  return (
    lemma
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'unknown'
  );
}

function isStarterLemma(lemma: string) {
  return /^[A-Za-z][A-Za-z'-]{0,17}$/.test(lemma) && lemma.length >= 2;
}

/** Broader alpha lemma check for dwyl word-list coverage (not the starter subset). */
function isAlphaLemma(lemma: string) {
  return /^[a-z][a-z'-]{0,44}$/i.test(lemma) && lemma.length >= 1;
}

/**
 * Import a limited batch of Kaikki English JSONL lines from GCS into Firestore.
 * Full corpus stays in the bucket; Firestore holds curated / progressive subsets.
 */
export async function importKaikkiBatchFromGcs(opts: {
  objectPath?: string;
  maxEntries?: number;
  startByte?: number;
}) {
  const objectPath =
    opts.objectPath ||
    'dictionary/sources/kaikki/kaikki.org-dictionary-English.jsonl.gz';
  const maxEntries = opts.maxEntries ?? 500;
  const db = getFirestore();
  const bucket = getStorage().bucket(BUCKET);
  const file = bucket.file(objectPath);

  const [exists] = await file.exists();
  if (!exists) throw new Error(`Missing GCS object: ${objectPath}`);

  // Detect gzip vs plain JSONL (some extracts are already uncompressed)
  const [head] = await file.download({ start: 0, end: 1 });
  const isGzip = head.length >= 2 && head[0] === 0x1f && head[1] === 0x8b;
  const readStream = file.createReadStream({
    start: opts.startByte || 0,
  });
  const input = isGzip ? readStream.pipe(createGunzip()) : readStream;
  const rl = readline.createInterface({
    input: Readable.from(input),
    crlfDelay: Infinity,
  });

  let written = 0;
  let scanned = 0;
  let batch = db.batch();
  let ops = 0;
  const retrievedAt = new Date().toISOString();

  const flush = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for await (const line of rl) {
    if (written >= maxEntries) break;
    const trimmed = line.trim();
    if (!trimmed) continue;
    scanned += 1;
    let row: Record<string, unknown>;
    try {
      row = JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      continue;
    }

    const word = String(row.word || row.title || '').trim();
    if (!word || !isStarterLemma(word)) continue;
    // Prefer English definitions of English lemmas
    const lang = String(row.lang || row.lang_code || 'en').toLowerCase();
    if (lang !== 'en' && lang !== 'english') continue;

    const pos = String(row.pos || 'unknown');
    const sensesRaw = Array.isArray(row.senses) ? row.senses : [];
    const senses = sensesRaw
      .slice(0, 8)
      .map((s: Record<string, unknown>, i: number) => {
        const glosses = Array.isArray(s.glosses)
          ? (s.glosses as string[])
          : s.gloss
            ? [String(s.gloss)]
            : [];
        const definition = glosses.filter(Boolean).join('; ').trim();
        if (!definition) return null;
        const examples = Array.isArray(s.examples)
          ? (s.examples as Array<string | { text?: string }>)
              .map((e) => (typeof e === 'string' ? e : e.text || ''))
              .filter(Boolean)
              .slice(0, 3)
          : [];
        return {
          id: `sense_kaikki_${slugLemma(word)}_${pos}_${i}`,
          partOfSpeech: pos,
          definition,
          definitionSource: 'kaikki_en',
          publicationAdaptation: null,
          examples,
          gapFlags: [
            'needs_publication_adaptation',
            'needs_illustration_brief',
            ...(examples.length ? [] : ['needs_example']),
          ],
          sourceLayers: [
            {
              provider: 'kaikki_en',
              datasetVersion: 'enwiktionary',
              sourceId: String(row.id || word),
              role: 'primary_definition' as const,
            },
          ],
        };
      })
      .filter(Boolean);

    if (!senses.length) continue;

    const id = `dict_${slugLemma(word)}`;
    const ref = db.collection('entries').doc(id);
    const existing = await ref.get();
    if (existing.exists && existing.data()?.editorialLocked === true) continue;

    // Merge: if Wordnet already present, append Kaikki senses that aren't duplicates
    const prev = existing.exists ? existing.data() : null;
    const prevSenses = Array.isArray(prev?.senses) ? prev!.senses : [];
    const mergedSenses = [...prevSenses];
    for (const s of senses) {
      const def = String((s as { definition: string }).definition).toLowerCase();
      const dup = mergedSenses.some(
        (p: { definition?: string }) =>
          String(p.definition || '').toLowerCase() === def,
      );
      if (!dup) mergedSenses.push(s);
    }

    batch.set(
      ref,
      {
        id,
        entryType: 'dictionary',
        lemma: word,
        language: 'en',
        senses: mergedSenses,
        verificationStatus: 'imported_unverified',
        editorialLocked: false,
        synthesis: {
          strategy: 'fill_gaps_from_sources',
          primarySource: prev?.synthesis?.primarySource || 'kaikki_en',
          pendingSources: ['open_english_wordnet', 'simple_wiktionary'],
        },
        sources: FieldValue.arrayUnion({
          label: 'Kaikki / English Wiktionary',
          url: 'https://kaikki.org/dictionary/English/',
          license: 'CC BY-SA (Wiktionary)',
          attributionRequired: true,
          attributionText:
            'Wiktionary data via kaikki.org / wiktextract. Share-alike and attribution required.',
          retrievedAt,
        }),
        updatedAt: FieldValue.serverTimestamp(),
        seededAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    written += 1;
    ops += 1;
    if (ops >= 200) await flush();
  }

  await flush();
  readStream.destroy();

  const report = {
    objectPath,
    scanned,
    written,
    maxEntries,
    bucket: BUCKET,
  };
  await db.collection('imports').add({
    type: 'kaikki_batch',
    ...report,
    createdAt: FieldValue.serverTimestamp(),
  });
  logger.info('Kaikki batch import complete', report);
  return report;
}

/**
 * Download a remote dictionary corpus straight into GCS (no laptop disk).
 * Runs in Cloud Functions / Cloud Run memory+temp.
 */
export async function fetchUrlToGcs(opts: {
  url: string;
  objectPath: string;
  contentType?: string;
}) {
  const bucket = getStorage().bucket(BUCKET);
  const file = bucket.file(opts.objectPath);
  const res = await fetch(opts.url);
  if (!res.ok || !res.body) {
    throw new Error(`Fetch failed ${res.status} for ${opts.url}`);
  }

  const nodeStream = Readable.fromWeb(res.body as import('stream/web').ReadableStream);
  const write = file.createWriteStream({
    resumable: true,
    metadata: {
      contentType: opts.contentType || res.headers.get('content-type') || 'application/octet-stream',
      metadata: {
        sourceUrl: opts.url,
        fetchedAt: new Date().toISOString(),
      },
    },
  });
  await pipe(nodeStream, write);
  const [meta] = await file.getMetadata();
  const report = {
    url: opts.url,
    objectPath: opts.objectPath,
    gcsUri: `gs://${BUCKET}/${opts.objectPath}`,
    size: meta.size,
  };
  logger.info('Fetched URL to GCS', report);
  await getFirestore().collection('imports').add({
    type: 'gcs_fetch',
    ...report,
    createdAt: FieldValue.serverTimestamp(),
  });
  return report;
}

type SynsetRow = {
  definition: string;
  examples: string[];
  partOfSpeech: string;
};

/**
 * Import Open English Wordnet JSON zip from GCS → Firestore.
 * Zip is staged in Cloud Functions /tmp only (never on the laptop).
 */
export async function importWordnetBatchFromGcs(opts: {
  objectPath?: string;
  maxEntries?: number;
  letterPrefix?: string;
}) {
  const objectPath =
    opts.objectPath ||
    'dictionary/sources/open-english-wordnet/english-wordnet-2025-json.zip';
  const maxEntries = opts.maxEntries ?? 300;
  const letterPrefix = (opts.letterPrefix || 'a').toLowerCase().slice(0, 1);
  const db = getFirestore();
  const bucket = getStorage().bucket(BUCKET);
  const file = bucket.file(objectPath);
  const [exists] = await file.exists();
  if (!exists) throw new Error(`Missing GCS object: ${objectPath}`);

  const tmpZip = path.join(
    os.tmpdir(),
    `oew-${Date.now()}-${Math.random().toString(36).slice(2)}.zip`,
  );
  await file.download({ destination: tmpZip });

  let written = 0;
  let scanned = 0;
  const retrievedAt = new Date().toISOString();

  try {
    const zip = new AdmZip(tmpZip);
    const synsets = new Map<string, SynsetRow>();
    for (const entry of zip.getEntries()) {
      const name = entry.entryName;
      if (!/\.json$/i.test(name) || name.startsWith('entries-') || name === 'frames.json') {
        continue;
      }
      const raw = JSON.parse(entry.getData().toString('utf8')) as Record<
        string,
        {
          definition?: string[];
          example?: string[];
          partOfSpeech?: string;
        }
      >;
      for (const [id, row] of Object.entries(raw)) {
        const definition = (row.definition || []).filter(Boolean).join('; ').trim();
        if (!definition) continue;
        synsets.set(id, {
          definition,
          examples: (row.example || []).filter(Boolean).slice(0, 3),
          partOfSpeech: POS_LABEL[String(row.partOfSpeech || '')] || String(row.partOfSpeech || 'unknown'),
        });
      }
    }

    const entriesName = `entries-${letterPrefix}.json`;
    const entriesEntry = zip.getEntry(entriesName);
    if (!entriesEntry) throw new Error(`Zip missing ${entriesName}`);
    const entries = JSON.parse(entriesEntry.getData().toString('utf8')) as Record<
      string,
      Record<string, { sense?: Array<{ id?: string; synset?: string }> }>
    >;

    let batch = db.batch();
    let ops = 0;
    const flush = async () => {
      if (ops === 0) return;
      await batch.commit();
      batch = db.batch();
      ops = 0;
    };

    for (const [lemma, posMap] of Object.entries(entries)) {
      if (written >= maxEntries) break;
      scanned += 1;
      if (!isStarterLemma(lemma)) continue;

      const senses: Array<Record<string, unknown>> = [];
      for (const [posKey, payload] of Object.entries(posMap || {})) {
        for (const [i, s] of (payload.sense || []).entries()) {
          const syn = s.synset ? synsets.get(s.synset) : undefined;
          if (!syn) continue;
          senses.push({
            id: `sense_oew_${slugLemma(lemma)}_${posKey}_${i}`,
            partOfSpeech: syn.partOfSpeech || POS_LABEL[posKey] || posKey,
            definition: syn.definition,
            definitionSource: 'open_english_wordnet',
            publicationAdaptation: null,
            examples: syn.examples,
            synsetId: s.synset || null,
            wordnetSenseId: s.id || null,
            gapFlags: [
              'needs_publication_adaptation',
              'needs_illustration_brief',
              ...(syn.examples.length ? [] : ['needs_example']),
            ],
            sourceLayers: [
              {
                provider: 'open_english_wordnet',
                datasetVersion: '2025-json',
                sourceId: s.id || s.synset || lemma,
                role: 'primary_definition' as const,
              },
            ],
          });
        }
      }
      if (!senses.length) continue;

      const id = `dict_${slugLemma(lemma)}`;
      const ref = db.collection('entries').doc(id);
      const existing = await ref.get();
      if (existing.exists && existing.data()?.editorialLocked === true) continue;

      const prev = existing.exists ? existing.data() : null;
      const prevSenses = Array.isArray(prev?.senses) ? prev!.senses : [];
      const mergedSenses = [...prevSenses];
      for (const s of senses) {
        const def = String(s.definition || '').toLowerCase();
        const dup = mergedSenses.some(
          (p: { definition?: string }) =>
            String(p.definition || '').toLowerCase() === def,
        );
        if (!dup) mergedSenses.push(s);
      }

      batch.set(
        ref,
        {
          id,
          entryType: 'dictionary',
          lemma,
          language: 'en',
          senses: mergedSenses,
          verificationStatus: 'imported_unverified',
          editorialLocked: false,
          synthesis: {
            strategy: 'fill_gaps_from_sources',
            primarySource: 'open_english_wordnet',
            pendingSources: ['kaikki_en', 'simple_wiktionary'],
          },
          sources: FieldValue.arrayUnion({
            label: 'Open English Wordnet',
            url: 'https://en-word.net/',
            license: 'CC BY 4.0 + Princeton WordNet',
            attributionRequired: true,
            attributionText:
              'Open English Wordnet (CC BY 4.0). Includes Princeton WordNet data under its terms.',
            retrievedAt,
            datasetVersion: '2025-json',
          }),
          updatedAt: FieldValue.serverTimestamp(),
          seededAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      written += 1;
      ops += 1;
      if (ops >= 200) await flush();
    }
    await flush();
  } finally {
    try {
      fs.unlinkSync(tmpZip);
    } catch {
      /* ignore */
    }
  }

  const report = {
    objectPath,
    letterPrefix,
    scanned,
    written,
    maxEntries,
    bucket: BUCKET,
  };
  await db.collection('imports').add({
    type: 'wordnet_batch',
    ...report,
    createdAt: FieldValue.serverTimestamp(),
  });
  logger.info('Wordnet batch import complete', report);
  return report;
}

/**
 * Import lemma stubs from dwyl/english-words (words_alpha.txt) into the dictionary DB.
 * Existing senses are preserved; locked docs are skipped. Definitions stay pending
 * for Wordnet/Kaikki synthesis.
 *
 * Source: https://github.com/dwyl/english-words (Unlicense)
 */
export async function importDwylWordListFromGcs(opts: {
  objectPath?: string;
  maxEntries?: number;
  letterPrefix?: string;
  skipExisting?: boolean;
}) {
  const objectPath =
    opts.objectPath ||
    'dictionary/sources/dwyl-english-words/words_alpha.txt';
  const maxEntries = opts.maxEntries ?? 5000;
  const letterPrefix = opts.letterPrefix
    ? String(opts.letterPrefix).toLowerCase().slice(0, 1)
    : undefined;
  const skipExisting = opts.skipExisting !== false;
  const db = getFirestore();
  const bucket = getStorage().bucket(BUCKET);
  const file = bucket.file(objectPath);
  const [exists] = await file.exists();
  if (!exists) throw new Error(`Missing GCS object: ${objectPath}`);

  const rl = readline.createInterface({
    input: file.createReadStream(),
    crlfDelay: Infinity,
  });

  // Fast path: lemmas index only (no per-doc reads, never touches locked entries).
  // Definition-bearing `entries` are filled by Wordnet/Kaikki imports.
  let writtenLemmas = 0;
  let scanned = 0;
  let batch = db.batch();
  let ops = 0;
  const retrievedAt = new Date().toISOString();
  void skipExisting;

  const flush = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for await (const line of rl) {
    if (writtenLemmas >= maxEntries) break;
    const lemma = line.trim().toLowerCase();
    if (!lemma) continue;
    scanned += 1;
    if (letterPrefix && lemma[0] !== letterPrefix) continue;
    if (!isAlphaLemma(lemma)) continue;

    const slug = slugLemma(lemma);
    batch.set(
      db.collection('lemmas').doc(slug),
      {
        id: slug,
        lemma,
        language: 'en',
        sources: FieldValue.arrayUnion('dwyl_english_words'),
        entryId: `dict_${slug}`,
        license: 'Unlicense',
        sourceUrl: 'https://github.com/dwyl/english-words',
        retrievedAt,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    writtenLemmas += 1;
    ops += 1;
    if (ops >= 450) await flush();
  }

  await flush();
  const report = {
    objectPath,
    letterPrefix: letterPrefix || null,
    scanned,
    writtenLemmas,
    maxEntries,
    bucket: BUCKET,
    collection: 'lemmas',
    source: 'https://github.com/dwyl/english-words',
  };
  await db.collection('imports').add({
    type: 'dwyl_wordlist_batch',
    ...report,
    createdAt: FieldValue.serverTimestamp(),
  });
  logger.info('dwyl word list import complete', report);
  return report;
}

function contentHash(text: string) {
  return createHash('sha1').update(text).digest('hex').slice(0, 12);
}

type WebsterRow = {
  word?: string;
  pos?: string;
  synonyms?: string;
  definitions?: string[];
};

/**
 * Import Webster's Unabridged (Gutenberg / ssvivian JSON) from GCS.
 * Definitions are year-stamped (default 1913) and archived in
 * `entries/{id}/definitionEditions` — never deleted on reimport; identical
 * wording is idempotent via content hash; changed wording appends a new edition.
 *
 * https://github.com/ssvivian/WebstersDictionary
 */
export async function importWebstersFromGcs(opts: {
  objectPath?: string;
  maxEntries?: number;
  letterPrefix?: string;
  /** Historical year this corpus represents (Webster Unabridged ≈ 1913). */
  asOfYear?: number;
}) {
  const objectPath =
    opts.objectPath || 'dictionary/sources/websters/dictionary.json';
  const maxEntries = opts.maxEntries ?? 2000;
  const letterPrefix = opts.letterPrefix
    ? String(opts.letterPrefix).toLowerCase().slice(0, 1)
    : undefined;
  const asOfYear = opts.asOfYear ?? 1913;
  const db = getFirestore();
  const bucket = getStorage().bucket(BUCKET);
  const file = bucket.file(objectPath);
  const [exists] = await file.exists();
  if (!exists) throw new Error(`Missing GCS object: ${objectPath}`);

  const tmp = path.join(
    os.tmpdir(),
    `websters-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  );
  await file.download({ destination: tmp });

  let written = 0;
  let scanned = 0;
  let editionsWritten = 0;
  let skippedLocked = 0;
  const retrievedAt = new Date().toISOString();

  try {
    const rows = JSON.parse(fs.readFileSync(tmp, 'utf8')) as WebsterRow[];
    if (!Array.isArray(rows)) throw new Error('Webster JSON must be an array');

    let batch = db.batch();
    let ops = 0;
    const flush = async () => {
      if (ops === 0) return;
      await batch.commit();
      batch = db.batch();
      ops = 0;
    };

    const sourceRec = {
      label: "Webster's Unabridged English Dictionary",
      url: 'https://github.com/ssvivian/WebstersDictionary',
      license: 'Project Gutenberg License (dictionary text); MIT (JSON packaging)',
      attributionRequired: true,
      attributionText:
        "Webster's Unabridged via Project Gutenberg ebook 29765 / ssvivian JSON. Keep attribution for Gutenberg terms.",
      retrievedAt,
      datasetVersion: `websters-${asOfYear}`,
      year: asOfYear,
    };

    for (const row of rows) {
      if (written >= maxEntries) break;
      scanned += 1;
      const lemma = String(row.word || '')
        .trim()
        .toLowerCase();
      if (!lemma || !isAlphaLemma(lemma)) continue;
      if (letterPrefix && lemma[0] !== letterPrefix) continue;

      const defs = (row.definitions || []).map((d) => String(d).trim()).filter(Boolean);
      if (!defs.length) continue;

      const id = `dict_${slugLemma(lemma)}`;
      const ref = db.collection('entries').doc(id);
      const existing = await ref.get();
      if (existing.exists && existing.data()?.editorialLocked === true) {
        skippedLocked += 1;
        continue;
      }

      const pos = String(row.pos || 'unknown').trim() || 'unknown';
      const synonymsRaw = String(row.synonyms || '').trim();
      const synonyms = synonymsRaw
        ? synonymsRaw
            .split(/[;,]/)
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 20)
        : [];

      const prev = existing.exists ? existing.data() : null;
      const prevSenses = Array.isArray(prev?.senses) ? [...prev!.senses] : [];
      const years = new Set<number>(
        Array.isArray(prev?.definitionYears) ? prev!.definitionYears : [],
      );
      years.add(asOfYear);

      const newSenses: Array<Record<string, unknown>> = [];
      for (const [i, definition] of defs.slice(0, 12).entries()) {
        const hash = contentHash(definition);
        const editionId = `${asOfYear}_websters_${i}_${hash}`;
        const edition = {
          year: asOfYear,
          yearLabel: String(asOfYear),
          provider: 'websters_unabridged',
          datasetVersion: 'ssvivian/WebstersDictionary',
          definition,
          partOfSpeech: pos,
          synonyms,
          license: sourceRec.license,
          sourceUrl: sourceRec.url,
          retrievedAt,
          contentHash: hash,
        };

        // Archive: never delete; identical hash is idempotent
        batch.set(
          ref.collection('definitionEditions').doc(editionId),
          {
            id: editionId,
            lemma,
            senseIndex: i,
            ...edition,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        editionsWritten += 1;
        ops += 1;

        const senseId = `sense_websters_${slugLemma(lemma)}_${i}`;
        const dupIdx = prevSenses.findIndex(
          (s: { definition?: string; definitionSource?: string; asOfYear?: number }) =>
            String(s.definition || '').toLowerCase() === definition.toLowerCase() ||
            (s.definitionSource === 'websters_unabridged' &&
              s.asOfYear === asOfYear &&
              String((s as { contentHash?: string }).contentHash || '') === hash),
        );

        if (dupIdx >= 0) {
          const existingSense = prevSenses[dupIdx] as {
            definitionHistory?: unknown[];
          };
          const hist = Array.isArray(existingSense.definitionHistory)
            ? existingSense.definitionHistory
            : [];
          const histHas = hist.some(
            (h) =>
              typeof h === 'object' &&
              h !== null &&
              (h as { contentHash?: string }).contentHash === hash,
          );
          if (!histHas) hist.push(edition);
          prevSenses[dupIdx] = {
            ...existingSense,
            asOfYear,
            contentHash: hash,
            definitionHistory: hist.slice(-20),
          };
        } else {
          newSenses.push({
            id: senseId,
            partOfSpeech: pos,
            definition,
            asOfYear,
            contentHash: hash,
            definitionSource: 'websters_unabridged',
            publicationAdaptation: null,
            examples: [],
            synonyms,
            gapFlags: [
              'needs_publication_adaptation',
              'needs_illustration_brief',
              'needs_example',
            ],
            sourceLayers: [
              {
                provider: 'websters_unabridged',
                datasetVersion: String(asOfYear),
                sourceId: lemma,
                role: 'primary_definition' as const,
              },
            ],
            definitionHistory: [edition],
          });
        }
      }

      const mergedSenses = [...prevSenses, ...newSenses];
      batch.set(
        ref,
        {
          id,
          entryType: 'dictionary',
          lemma,
          language: 'en',
          senses: mergedSenses,
          definitionYears: Array.from(years).sort((a, b) => a - b),
          verificationStatus: 'imported_unverified',
          editorialLocked: false,
          synthesis: {
            strategy: 'fill_gaps_from_sources',
            primarySource: prev?.synthesis?.primarySource || 'websters_unabridged',
            pendingSources: [
              'open_english_wordnet',
              'kaikki_en',
              'simple_wiktionary',
            ],
          },
          sources: FieldValue.arrayUnion(sourceRec),
          updatedAt: FieldValue.serverTimestamp(),
          seededAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      written += 1;
      ops += 1;
      if (ops >= 350) await flush();
    }
    await flush();
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }

  const report = {
    objectPath,
    asOfYear,
    letterPrefix: letterPrefix || null,
    scanned,
    written,
    editionsWritten,
    skippedLocked,
    maxEntries,
    bucket: BUCKET,
    source: 'https://github.com/ssvivian/WebstersDictionary',
  };
  await db.collection('imports').add({
    type: 'websters_batch',
    ...report,
    createdAt: FieldValue.serverTimestamp(),
  });
  logger.info('Webster import complete', report);
  return report;
}

/** Register source objects already in GCS (metadata only). */
export async function registerDictionarySources() {
  const db = getFirestore();
  const sources = [
    {
      id: 'oew-2019',
      path: 'dictionary/sources/open-english-wordnet/english-wordnet-2019.zip',
      license: 'CC BY 4.0 + Princeton WordNet',
    },
    {
      id: 'oew-2025-json',
      path: 'dictionary/sources/open-english-wordnet/english-wordnet-2025-json.zip',
      license: 'CC BY 4.0 + Princeton WordNet',
    },
    {
      id: 'kaikki-en',
      path: 'dictionary/sources/kaikki/kaikki.org-dictionary-English.jsonl.gz',
      license: 'CC BY-SA (Wiktionary via kaikki.org)',
      url: 'https://kaikki.org/dictionary/English/',
    },
    {
      id: 'kaikki-simple',
      path: 'dictionary/sources/kaikki/simple-extract.jsonl.gz',
      license: 'CC BY-SA (Wiktionary via kaikki.org)',
      url: 'https://kaikki.org/dictionary/rawdata.html',
    },
    {
      id: 'dwyl-english-words',
      path: 'dictionary/sources/dwyl-english-words/words_alpha.txt',
      license: 'Unlicense',
      url: 'https://github.com/dwyl/english-words',
      note: 'Also words.txt + words_dictionary.json in same GCS folder',
    },
    {
      id: 'websters-unabridged',
      path: 'dictionary/sources/websters/dictionary.json',
      license: 'Project Gutenberg License (text); MIT (JSON packaging)',
      url: 'https://github.com/ssvivian/WebstersDictionary',
      year: 1913,
      note: 'Year-stamped definition editions; archive in entries/*/definitionEditions',
    },
    {
      id: 'english-word-database',
      path: 'englishwords/sources/README.csv',
      license: 'CC BY-SA (Wiktionary via kaikki.org)',
      url: 'https://docs.google.com/spreadsheets/d/1vrMpdBc0oyDI2_VN15TityjvqevJU6q2SQEJPeTrLcQ/edit?usp=sharing',
      note: 'Own Firestore DB englishwords (~1.49M Kaikki entries by letter tab). Working catalogue for book headwords.',
      namedDatabase: 'englishwords',
      totalEntries: 1491502,
    },
  ];

  for (const s of sources) {
    await db.collection('dictionarySources').doc(s.id).set(
      {
        ...s,
        bucket: BUCKET,
        gcsUri: `gs://${BUCKET}/${s.path}`,
        storage: 'gcs',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }
  return { registered: sources.length, bucket: BUCKET };
}
