# Print / Amazon KDP export notes

## Outputs

1. **Interior PDF** — ordered pages; guide left (even), coloring right (odd) for current English format.
2. **Full-wrap cover PDF** — separate file from interior.

## Validation checklist

- Page order and left/right placement
- Trim size, bleed, margins
- Image resolution (raster drafts must pass print checks)
- Fonts embedded
- Missing assets / unresolved licenses
- Required attribution / source notices
- Marketing mockups excluded from interiors

## Amazon KDP

- **No KDP publishing API assumed.** Submission stays manual unless a supported integration is confirmed and authorized.
- Re-verify current KDP trim, bleed, spine, and cover template requirements at each export (they change).
- Prepare metadata (title, subtitle, description, keywords, categories) alongside upload-ready files.
- Keep estimated KDP economics separate from reported royalties in finance records.

## Edition pinning

Books store `pinnedAssetVersions` so later database changes do not silently alter an exported edition. Always export from pinned approved versions after final book approval.
