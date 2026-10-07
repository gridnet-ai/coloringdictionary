# Coloring Dictionary — data schema

Brand promise: **A dictionary that you can color.**

## Collections (Firestore)

| Collection | Purpose |
|------------|---------|
| `entries` | Flower meanings, dictionary senses, encyclopedia subjects |
| `books` | Editions with ordered pages + pinned asset versions |
| `assets` | Covers, pages, marketing mockups, logos (metadata; files in Storage) |
| `productionJobs` | Resumable agentic pipeline jobs |
| `imports` | Import reports / audit trail |
| `staff` | Owner / editor / illustrator / reviewer roles |
| `crmContacts` / `crmOpportunities` | CRM (milestone: local store first) |
| `financeSales` / `financeExpenses` | Actuals (owner-only rules) |
| `customerProjects/{uid}` | Future Build a Coloring Dictionary (private) |

## Entry rules

- Stable IDs (`flower_*`, later `dict_*`, `ency_*`).
- Keep **source text** separate from **publicationAdaptation**.
- `editorialLocked: true` blocks reimport overwrite of reviewed fields.
- Meanings for flowers: historical / Terry List / almanac / modern / adaptation.
- Dictionary senses are separate documents/fields so illustrations target one sense.
- Document licenses, attribution, verification status. Folklore ≠ factual claims.

## Books

- English format: learning guide on **even / left**, coloring on **odd / right**.
- Pin `pinnedAssetVersions` so later DB edits do not silently change an exported edition.
- Author credit imported from tracker is editable and flagged for confirmation.

## Assets

- Storage paths under `/assets` and `/exports`.
- `availability`: local | external_link | missing | unknown | confirmed.
- Marketing mockups never count as print-ready interiors.
- Generation metadata: prompt, model, provider, timestamp, QA result.

## Staged seed

`public/data/seed/*.json` from `scripts/import_workbooks.py`:

- 745 Final Draft flower records (recalculated)
- Volume One, Texas, Christmas books
- Covers + local asset registry
- Almanac sheet snapshots

Owner API: `POST /api/owner/seed` with `OWNER_SEED_TOKEN` (skips `editorialLocked` unless `force`).
