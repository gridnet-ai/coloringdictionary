/**
 * Stream Open English Wordnet JSON ZIP → compact dictionary seed.
 * Does not fully extract the ZIP (low disk). Synsets held in memory; entries streamed.
 *
 * Usage:
 *   node scripts/import_wordnet.mjs [path/to/english-wordnet-2025-json.zip]
 *   node scripts/import_wordnet.mjs --limit=2000
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DEFAULT_ZIP = path.join(
  process.env.USERPROFILE || '',
  'Downloads',
  'english-wordnet-2025-json.zip',
);

const POS_LABEL = {
  n: 'noun',
  v: 'verb',
  a: 'adjective',
  s: 'adjective',
  r: 'adverb',
};

const SOURCE = {
  label: 'Open English Wordnet',
  datasetVersion: '2025',
  license: 'CC BY 4.0 (with Princeton WordNet terms)',
  attributionRequired: true,
  attributionText:
    'Definitions from Open English Wordnet 2025 (CC BY 4.0), based on Princeton WordNet. Adaptations for Coloring Dictionary will be marked separately.',
  url: 'https://en-word.net/',
};

function parseArgs(argv) {
  let zip = DEFAULT_ZIP;
  let limit = Infinity;
  for (const a of argv) {
    if (a.startsWith('--limit=')) limit = Number(a.slice(8)) || Infinity;
    else if (!a.startsWith('-')) zip = a;
  }
  return { zip, limit };
}

function slugLemma(lemma) {
  return String(lemma)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'unknown';
}

function entryId(lemma) {
  return `dict_${slugLemma(lemma)}`;
}

function senseId(rawId, synsetId, lemma, pos) {
  if (rawId) return `sense_${String(rawId).replace(/[^a-zA-Z0-9]+/g, '_')}`;
  return `sense_${slugLemma(lemma)}_${pos}_${String(synsetId).replace(/[^a-z0-9]+/gi, '_')}`;
}

/** Prefer single-token A–Z lemmas for first coloring-dictionary pass. */
function isStarterLemma(lemma) {
  if (!/^[A-Za-z][A-Za-z'-]*$/.test(lemma)) return false;
  if (lemma.length < 2 || lemma.length > 18) return false;
  if (lemma.includes("'") && lemma.length < 4) return false;
  return true;
}

async function loadZipEntries(zipPath) {
  // Use native Node experimental? Prefer unzipper-less: powershell-free via 'fflate' if present, else adm-zip, else manual.
  let JSZip;
  try {
    JSZip = (await import('jszip')).default;
  } catch {
    // install not desired on full disk — use child unzip streaming via PowerShell Extract for synsets only is too big
  }
  if (!JSZip) {
    // Fallback: use Node built-in? Not available. Use zlib on each local file after selective extract is impossible.
    // Use Windows Shell.Application or PowerShell Expand-Archive of zip to temp is 69MB.
    throw new Error(
      'jszip required. Run: npm install jszip --no-save  OR npm install jszip --prefix scripts-tmp',
    );
  }
  const buf = fs.readFileSync(zipPath);
  return JSZip.loadAsync(buf);
}

async function readJson(zip, name) {
  const file = zip.file(name);
  if (!file) return null;
  const text = await file.async('string');
  return JSON.parse(text);
}

async function main() {
  const { zip: zipPath, limit } = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(zipPath)) {
    console.error('ZIP not found:', zipPath);
    process.exit(1);
  }

  console.log('Loading ZIP into memory…', zipPath);
  const zip = await loadZipEntries(zipPath);
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
  const synsetFiles = names.filter((n) => /^(noun|verb|adj|adv)\./.test(n));
  const entryFiles = names.filter((n) => /^entries-/.test(n)).sort();

  console.log('Synset files', synsetFiles.length, 'entry files', entryFiles.length);

  /** @type {Map<string, {definition:string, examples:string[], pos:string, members:string[]}>} */
  const synsets = new Map();
  for (const name of synsetFiles) {
    process.stdout.write(`  synset ${name}… `);
    const data = await readJson(zip, name);
    let n = 0;
    for (const [id, row] of Object.entries(data || {})) {
      const defs = Array.isArray(row.definition) ? row.definition : [];
      const definition = defs.filter(Boolean).join('; ').trim();
      if (!definition) continue;
      const examples = Array.isArray(row.example) ? row.example.filter(Boolean) : [];
      synsets.set(id, {
        definition,
        examples,
        pos: row.partOfSpeech || name.split('.')[0]?.[0] || '',
        members: Array.isArray(row.members) ? row.members : [],
      });
      n += 1;
    }
    console.log(n);
  }
  console.log('Synsets loaded:', synsets.size);

  const outDir = path.join(ROOT, 'data', 'dictionary');
  const publicDir = path.join(ROOT, 'public', 'data', 'seed');
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });

  const gzPath = path.join(outDir, 'oew-2025.entries.ndjson.gz');
  const gzip = zlib.createGzip({ level: 6 });
  const out = fs.createWriteStream(gzPath);
  gzip.pipe(out);

  const writeLine = (obj) =>
    new Promise((resolve, reject) => {
      const ok = gzip.write(JSON.stringify(obj) + '\n');
      if (ok) resolve();
      else gzip.once('drain', resolve);
      gzip.once('error', reject);
    });

  let entriesWritten = 0;
  let sensesWritten = 0;
  let lemmasSeen = 0;
  let skippedNoSynset = 0;
  const preview = [];
  const posCounts = {};
  const retrievedAt = new Date().toISOString();

  for (const name of entryFiles) {
    if (entriesWritten >= limit) break;
    process.stdout.write(`  entries ${name}… `);
    const data = await readJson(zip, name);
    let fileCount = 0;
    for (const [lemma, posMap] of Object.entries(data || {})) {
      if (entriesWritten >= limit) break;
      lemmasSeen += 1;
      if (!isStarterLemma(lemma)) continue;

      const senses = [];
      for (const [pos, bundle] of Object.entries(posMap || {})) {
        const list = Array.isArray(bundle?.sense) ? bundle.sense : [];
        const pronunciations = Array.isArray(bundle?.pronunciation)
          ? bundle.pronunciation
          : [];
        const pronunciation =
          pronunciations.find((p) => p.variety === 'US')?.value ||
          pronunciations[0]?.value ||
          undefined;

        for (const s of list) {
          const syn = synsets.get(s.synset);
          if (!syn) {
            skippedNoSynset += 1;
            continue;
          }
          const posLabel = POS_LABEL[pos] || pos;
          posCounts[posLabel] = (posCounts[posLabel] || 0) + 1;
          senses.push({
            id: senseId(s.id, s.synset, lemma, pos),
            partOfSpeech: posLabel,
            definition: syn.definition,
            definitionSource: 'oew_2025',
            publicationAdaptation: null,
            examples: syn.examples.slice(0, 3),
            pronunciation,
            synsetId: s.synset,
            wordnetSenseId: s.id || null,
            gapFlags: [
              ...(syn.examples.length ? [] : ['needs_example']),
              'needs_publication_adaptation',
              'needs_illustration_brief',
            ],
            sourceLayers: [
              {
                provider: 'open_english_wordnet',
                datasetVersion: SOURCE.datasetVersion,
                sourceId: s.id || s.synset,
                role: 'primary_definition',
              },
            ],
          });
          sensesWritten += 1;
        }
      }

      if (!senses.length) continue;

      const entry = {
        id: entryId(lemma),
        entryType: 'dictionary',
        lemma,
        language: 'en',
        senses,
        verificationStatus: 'imported_unverified',
        editorialLocked: false,
        synthesis: {
          strategy: 'fill_gaps_from_sources',
          primarySource: 'open_english_wordnet',
          pendingSources: ['kaikki_en', 'simple_wiktionary'],
        },
        sources: [
          {
            ...SOURCE,
            sourceId: `lemma:${lemma}`,
            retrievedAt,
          },
        ],
        provenance: [
          {
            workbook: path.basename(zipPath),
            sheet: name,
            importedAt: retrievedAt,
          },
        ],
      };

      await writeLine(entry);
      entriesWritten += 1;
      fileCount += 1;
      if (preview.length < 120) preview.push(entry);
    }
    console.log(fileCount, 'entries');
  }

  await new Promise((resolve, reject) => {
    gzip.end();
    out.on('finish', resolve);
    out.on('error', reject);
  });

  const manifest = {
    importedAt: retrievedAt,
    brandPromise: 'A dictionary that you can color.',
    source: SOURCE,
    zip: path.basename(zipPath),
    counts: {
      lemmasScanned: lemmasSeen,
      entriesWritten,
      sensesWritten,
      synsetsLoaded: synsets.size,
      skippedNoSynset,
      byPartOfSpeech: posCounts,
      limit: Number.isFinite(limit) ? limit : null,
    },
    outputs: {
      compressedEntries: 'data/dictionary/oew-2025.entries.ndjson.gz',
      preview: 'public/data/seed/dictionary-preview.json',
      manifest: 'public/data/seed/dictionary-manifest.json',
    },
    notes: [
      'Starter filter: alphabetic lemmas (2–18 chars). Multiword phrases deferred.',
      'Each sense is a stable illustration target; books must pin sense IDs.',
      'publicationAdaptation stays empty until editorial rewrite; reimport must not overwrite editorialLocked.',
      'Next: merge Kaikki / Simple Wiktionary for missing examples and simpler wording.',
      'AI rewrite does not remove CC BY / WordNet attribution obligations.',
    ],
  };

  fs.writeFileSync(
    path.join(publicDir, 'dictionary-manifest.json'),
    JSON.stringify(manifest, null, 2),
  );
  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  );
  fs.writeFileSync(
    path.join(publicDir, 'dictionary-preview.json'),
    JSON.stringify(preview, null, 2),
  );

  const gzStat = fs.statSync(gzPath);
  console.log('\nDone.');
  console.log(JSON.stringify(manifest.counts, null, 2));
  console.log('Wrote', gzPath, `(${(gzStat.size / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
