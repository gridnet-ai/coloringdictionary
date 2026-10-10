import {
  matchesAgeFilter,
  parseAgeGroupParam,
  type AgeGroupId,
} from '@/lib/ageGroups';
import { CATALOG, type CatalogProduct } from '@/lib/catalog';

export function catalogSearchHaystack(product: CatalogProduct): string {
  return [
    product.title,
    product.seriesLabel,
    product.blurb,
    product.badge,
    product.format,
    product.slug,
    ...(product.keywords || []),
    ...(product.ageFilters || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function matchesShopQuery(
  product: CatalogProduct,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = catalogSearchHaystack(product);
  return q.split(/\s+/).every((token) => hay.includes(token));
}

export function filterCatalog(opts: {
  age?: string | null;
  q?: string | null;
}): CatalogProduct[] {
  const age = parseAgeGroupParam(opts.age);
  const q = opts.q || '';
  return CATALOG.filter(
    (p) =>
      matchesAgeFilter(p.readingAge, age, p.ageFilters) &&
      matchesShopQuery(p, q),
  );
}

export function ageHref(id: AgeGroupId, q?: string | null): string {
  const params = new URLSearchParams();
  if (id !== 'all') params.set('age', id);
  const query = (q || '').trim();
  if (query) params.set('q', query);
  const qs = params.toString();
  return qs ? `/shop?${qs}` : '/shop';
}
