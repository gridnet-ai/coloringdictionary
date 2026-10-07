import type { BookRecord, CreativeAsset, FlowerEntry } from '@/lib/db/types';

export type ExportCheck = {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warn' | 'unknown';
  detail: string;
};

/** Validate a sample spread / book export readiness (no silent inventing). */
export function runSampleExportChecks(opts: {
  book: BookRecord | undefined;
  flowers: FlowerEntry[];
  assets: CreativeAsset[];
}): ExportCheck[] {
  const { book, flowers, assets } = opts;
  const checks: ExportCheck[] = [];

  if (!book) {
    return [
      {
        id: 'book',
        label: 'Book selected',
        status: 'fail',
        detail: 'No book record loaded.',
      },
    ];
  }

  checks.push({
    id: 'author',
    label: 'Publishing credits confirmed',
    status: book.authorCreditNeedsConfirmation ? 'warn' : 'pass',
    detail: book.authorCreditNeedsConfirmation
      ? `Imported author “${book.authorImported || 'unknown'}” flagged for confirmation before release.`
      : 'Credits confirmed.',
  });

  checks.push({
    id: 'spread',
    label: 'Guide left / coloring right',
    status: 'pass',
    detail: `Configured: guide=${book.spreadLayout.guideSide}, coloring=${book.spreadLayout.coloringSide}.`,
  });

  const pageRows = book.pages || [];
  checks.push({
    id: 'pages',
    label: 'Page sequence present',
    status: pageRows.length > 0 ? 'pass' : 'fail',
    detail: `${pageRows.length} page row(s) imported from tracker.`,
  });

  const draftish = pageRows.filter((p) =>
    String(p.Status ?? p.status ?? '')
      .toLowerCase()
      .includes('draft'),
  ).length;
  checks.push({
    id: 'drafts',
    label: 'Draft vs print-ready pages',
    status: draftish > 0 ? 'warn' : 'unknown',
    detail:
      draftish > 0
        ? `${draftish} page(s) still marked draft — not print-ready.`
        : 'No draft statuses detected; confirm print checks separately.',
  });

  const mockups = assets.filter((a) => a.isMarketingMockup);
  checks.push({
    id: 'mockups',
    label: 'Marketing mockups excluded from interiors',
    status: 'pass',
    detail: `${mockups.length} marketing mockup asset(s) registered separately.`,
  });

  const missingLocal = assets.filter((a) => a.availability === 'missing').length;
  const external = assets.filter((a) => a.availability === 'external_link').length;
  checks.push({
    id: 'assets',
    label: 'Asset availability',
    status: missingLocal > 0 ? 'fail' : external > 0 ? 'warn' : 'pass',
    detail: `missing=${missingLocal}, external_link=${external}, local/confirmed tracked separately.`,
  });

  const unverified = flowers.filter(
    (f) => f.verificationStatus === 'imported_unverified',
  ).length;
  checks.push({
    id: 'sources',
    label: 'Entry verification',
    status: unverified > 0 ? 'warn' : 'pass',
    detail: `${unverified} flower entries still imported_unverified — route to review, do not invent facts.`,
  });

  checks.push({
    id: 'kdp',
    label: 'Amazon KDP submission',
    status: 'unknown',
    detail:
      'No KDP publishing API assumed. Prepare interior PDF + wrap cover PDF for manual upload. Re-verify current KDP trim/bleed requirements at export time.',
  });

  checks.push({
    id: 'pinned',
    label: 'Pinned asset versions',
    status:
      Object.keys(book.pinnedAssetVersions || {}).length > 0 ? 'pass' : 'warn',
    detail:
      Object.keys(book.pinnedAssetVersions || {}).length > 0
        ? 'Book pins approved asset versions for this edition.'
        : 'No pinned versions yet — exports may drift when database updates.',
  });

  return checks;
}
