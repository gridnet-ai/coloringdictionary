import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://coloringdictionary.com';

type SeedManifest = {
  importedAt?: string;
  brandPromise?: string;
  counts?: Record<string, unknown>;
};

/**
 * Pull staged seed JSON from hosting and write to Firestore.
 * Skips documents that already have editorialLocked === true (reimport-safe).
 */
export async function seedFromPublicHosting(opts: {
  force?: boolean;
  maxFlowers?: number;
}): Promise<{
  ok: boolean;
  written: Record<string, number>;
  skippedLocked: number;
  manifest?: SeedManifest;
}> {
  const db = getFirestore();
  const written: Record<string, number> = {
    entries: 0,
    books: 0,
    assets: 0,
    imports: 0,
  };
  let skippedLocked = 0;

  const fetchJson = async <T>(name: string): Promise<T> => {
    const url = `${SITE_ORIGIN}/data/seed/${name}.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    return (await res.json()) as T;
  };

  const manifest = await fetchJson<SeedManifest>('manifest');
  const flowers = await fetchJson<Array<Record<string, unknown>>>('flowers');
  const books = await fetchJson<Array<Record<string, unknown>>>('books');
  const assets = await fetchJson<Array<Record<string, unknown>>>('assets');

  const limit = opts.maxFlowers ?? flowers.length;
  const slice = flowers.slice(0, limit);

  // Batch writes (max ~400 ops per commit to stay under limits)
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
    if (!opts.force) {
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
        updatedAt: FieldValue.serverTimestamp(),
        seededAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    written.entries += 1;
    ops += 1;
    if (ops >= 400) await flush();
  }
  await flush();

  for (const book of books) {
    const id = String(book.id || '');
    if (!id) continue;
    batch.set(
      db.collection('books').doc(id),
      {
        ...book,
        updatedAt: FieldValue.serverTimestamp(),
        seededAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    written.books += 1;
    ops += 1;
    if (ops >= 400) await flush();
  }
  await flush();

  for (const asset of assets) {
    const id = String(asset.id || '');
    if (!id) continue;
    batch.set(
      db.collection('assets').doc(id),
      {
        ...asset,
        updatedAt: FieldValue.serverTimestamp(),
        seededAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    written.assets += 1;
    ops += 1;
    if (ops >= 400) await flush();
  }
  await flush();

  const importRef = db.collection('imports').doc();
  await importRef.set({
    type: 'workbook_seed',
    source: 'public/data/seed',
    manifest,
    written,
    skippedLocked,
    force: Boolean(opts.force),
    createdAt: FieldValue.serverTimestamp(),
  });
  written.imports = 1;

  logger.info('Seed complete', { written, skippedLocked });
  return { ok: true, written, skippedLocked, manifest };
}
