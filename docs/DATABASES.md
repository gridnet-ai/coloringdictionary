# Dual Firestore databases

Coloring Dictionary uses **two** Cloud Firestore databases in project `coloringdictionary` (location `nam5`):

| Database ID | Label | Purpose |
|-------------|--------|---------|
| `(default)` | Dictionary | Word dictionary entries (`dict_*`), encyclopedia (`ency_*`), books, assets, staff, CRM |
| `floriography` | Flower Meaning / Floriography | Flower meaning catalog (`flower_*`), Greenaway 1884 lines (`dictionary1884`), import meta |

## Sources

- **Dictionary:** GCS corpora under `dictionary/sources/` (Wordnet, Kaikki) → `(default)/entries`
- **Floriography:** Copied from TerryList (`C:\terrylist\public\data\flowers.json`, 713 flowers) → GCS `floriography/sources/` → `floriography/entries`

## Client SDK

```ts
import { db, floriographyDb } from './lib/firebase';
// db → dictionary
// floriographyDb → flower meanings
```

## Owner APIs

```http
POST /api/owner/floriography/import
{ "token": "<OWNER_SEED_TOKEN>" }

POST /api/owner/dictionary/floriography-entry
{ "token": "<OWNER_SEED_TOKEN>" }
```

The second call upserts the editorial **floriography** lemma (+ encyclopedia article) into the dictionary database.
