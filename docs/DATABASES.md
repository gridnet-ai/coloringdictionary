# Firestore databases

Coloring Dictionary uses **three** Cloud Firestore databases in project `coloringdictionary` (location `nam5`):

| Database ID | Label | Purpose |
|-------------|--------|---------|
| `(default)` | Dictionary (universal) | Word dictionary entries (`dict_*`), encyclopedia (`ency_*`), books, assets, staff, CRM, `dictionarySources` registry |
| `floriography` | Flower Meaning / Floriography | Flower meaning catalog (`flower_*`), Greenaway 1884 lines (`dictionary1884`), import meta |
| `englishwords` | English Word Database | Kaikki / Wiktionary catalogue (~1.49M entries by letter tab) for book headword planning — own DB, also registered in universal `dictionarySources` |

## Sources

- **Dictionary:** GCS corpora under `dictionary/sources/` (Wordnet, Kaikki, dwyl, Webster) → `(default)/entries`
- **Floriography:** TerryList flowers → GCS `floriography/sources/` → `floriography/entries`
- **English Word Database:** Google Sheet + README → GCS `englishwords/sources/` → `englishwords` meta/tabs/entries  
  Sheet: https://docs.google.com/spreadsheets/d/1vrMpdBc0oyDI2_VN15TityjvqevJU6q2SQEJPeTrLcQ/edit?usp=sharing  
  Source: kaikki.org English (Wiktionary), extracted 2026-10-03 from enwiktionary 2026-09-02 dump. License: CC BY-SA.

## Client SDK

```ts
import { db, floriographyDb, englishWordsDb } from './lib/firebase';
// db → dictionary (universal)
// floriographyDb → flower meanings
// englishWordsDb → English word catalogue
```

## Owner APIs

```http
POST /api/owner/floriography/import
{ "token": "<OWNER_SEED_TOKEN>" }

POST /api/owner/dictionary/floriography-entry
{ "token": "<OWNER_SEED_TOKEN>" }

POST /api/owner/englishwords/register
{ "token": "<OWNER_SEED_TOKEN>", "readmeText": "..." }

POST /api/owner/englishwords/import-csv
{ "token": "<OWNER_SEED_TOKEN>", "objectPath": "englishwords/sources/tab-A.csv", "tab": "A", "maxEntries": 50000 }
```

`englishwords/register` writes meta + tab counts into the named DB and registers `english-word-database` in `(default)/dictionarySources`.
