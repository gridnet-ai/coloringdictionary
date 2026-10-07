import type { BookRecord, CreativeAsset, FlowerEntry } from '@/lib/db/types';

export type SeedManifest = {
  importedAt: string;
  brandPromise: string;
  counts: Record<string, unknown>;
  summarySnapshot: Record<string, unknown>;
  notes: string[];
};

export async function loadSeed<T>(name: string): Promise<T> {
  const res = await fetch(`/data/seed/${name}.json`);
  if (!res.ok) throw new Error(`Failed to load seed ${name}`);
  return res.json() as Promise<T>;
}

export async function loadOwnerBundle() {
  const [manifest, flowers, books, dashboard, assets, vol1] = await Promise.all([
    loadSeed<SeedManifest>('manifest'),
    loadSeed<FlowerEntry[]>('flowers'),
    loadSeed<BookRecord[]>('books'),
    loadSeed<Record<string, unknown>[]>('dashboard'),
    loadSeed<CreativeAsset[]>('assets'),
    loadSeed<Record<string, unknown>[]>('vol1-flowers'),
  ]);
  return { manifest, flowers, books, dashboard, assets, vol1 };
}
