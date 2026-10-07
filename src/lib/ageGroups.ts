/** Site browse filters aligned with common reading-age bands (KDP min–max). */
export type AgeGroupId = 'all' | '0-2' | '3-5' | '6-8' | '9-12' | '13-17';

export type AgeGroup = {
  id: AgeGroupId;
  label: string;
  /** Short line for menu / chips */
  audience: string;
  /** Inclusive range; omitted for the “All ages” browse option */
  min?: number;
  max?: number;
};

/**
 * “All ages” is a site browse option for general-audience titles.
 * On KDP it is not a separate age group — leave reading age blank or set
 * min–max for the book’s intended audience so it can appear in age searches.
 */
export const AGE_GROUPS: AgeGroup[] = [
  {
    id: 'all',
    label: 'All ages',
    audience: 'General audience',
  },
  {
    id: '0-2',
    label: '0–2',
    audience: 'Babies and toddlers',
    min: 0,
    max: 2,
  },
  {
    id: '3-5',
    label: '3–5',
    audience: 'Preschoolers; picture books',
    min: 3,
    max: 5,
  },
  {
    id: '6-8',
    label: '6–8',
    audience: 'Early readers',
    min: 6,
    max: 8,
  },
  {
    id: '9-12',
    label: '9–12',
    audience: 'Middle-grade readers',
    min: 9,
    max: 12,
  },
  {
    id: '13-17',
    label: '13–17',
    audience: 'Teen and young adult readers',
    min: 13,
    max: 17,
  },
];

export type ReadingAge = {
  /** Inclusive minimum reading age (KDP). Omit both for general / all-ages. */
  min?: number;
  max?: number;
};

export function parseAgeGroupParam(value: string | null | undefined): AgeGroupId {
  if (!value) return 'all';
  const hit = AGE_GROUPS.find((g) => g.id === value);
  return hit ? hit.id : 'all';
}

export function ageGroupById(id: AgeGroupId): AgeGroup {
  return AGE_GROUPS.find((g) => g.id === id) ?? AGE_GROUPS[0];
}

/** Display label for a book’s reading-age fields. */
export function formatReadingAgeLabel(age?: ReadingAge | null): string {
  if (!age || (age.min == null && age.max == null)) return 'All ages';
  const min = age.min ?? age.max ?? 0;
  const max = age.max ?? age.min ?? min;
  if (min === max) return `Ages ${min}`;
  return `Ages ${min}–${max}`;
}

/**
 * Filter match for catalogue / collection.
 * - `all` browse chip shows the full catalogue.
 * - A specific band shows titles tagged for that band, or tagged `all`
 *   (general-audience books appear across age filters).
 * - Falls back to reading-age min–max overlap when no tags are provided.
 */
export function matchesAgeFilter(
  age: ReadingAge | null | undefined,
  filterId: AgeGroupId,
  ageFilters?: AgeGroupId[] | null,
): boolean {
  if (filterId === 'all') return true;
  if (ageFilters && ageFilters.length > 0) {
    return ageFilters.includes(filterId) || ageFilters.includes('all');
  }
  const band = ageGroupById(filterId);
  if (band.min == null || band.max == null) return true;
  if (!age || (age.min == null && age.max == null)) return true;
  const min = age.min ?? age.max ?? 0;
  const max = age.max ?? age.min ?? min;
  return min <= band.max && max >= band.min;
}
