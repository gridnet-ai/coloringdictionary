# Dictionary sources on GCS / Firestore

Local disk is **not** used for dictionary corpora. Sources live in Firebase Storage; curated entries are written to Firestore.

**Bucket:** `gs://coloringdictionary.firebasestorage.app`

## Objects

| Path | Source | Notes |
|------|--------|--------|
| `dictionary/sources/open-english-wordnet/english-wordnet-2019.zip` | Open English Wordnet 2019 | Uploaded from Downloads |
| `dictionary/sources/open-english-wordnet/english-wordnet-2025-json.zip` | Open English Wordnet 2025 JSON | Uploaded from Downloads |
| `dictionary/sources/kaikki/kaikki.org-dictionary-English.jsonl.gz` | [Kaikki English](https://kaikki.org/dictionary/English/) | Streamed (~523MB gzip) |
| `dictionary/sources/kaikki/simple-extract.jsonl.gz` | [Kaikki Simple English](https://kaikki.org/dictionary/rawdata.html) | Streamed (~4.5MB) |
| `dictionary/sources/websters/dictionary.json` | [ssvivian/WebstersDictionary](https://github.com/ssvivian/WebstersDictionary) | Webster Unabridged JSON (~1913 / Gutenberg) |
| `dictionary/sources/websters/dictionary.txt` | same | Gutenberg source text |
| `dictionary/sources/dwyl-english-words/words_alpha.txt` | [dwyl/english-words](https://github.com/dwyl/english-words) | ~370k alpha lemmas (Unlicense) |
| `dictionary/sources/dwyl-english-words/words.txt` | same | Full word list incl. non-alpha |
| `dictionary/sources/dwyl-english-words/words_dictionary.json` | same | JSON map of alpha words |
| `dictionary/sources/registry.json` | Internal | Source registry metadata |

Raw Wiktextract dump (optional later): [rawdata.html](https://kaikki.org/dictionary/rawdata.html) (~2.8GB gzip) — stream only, never download to the laptop.

## Synthesis strategy

1. **Lemma coverage:** [dwyl/english-words](https://github.com/dwyl/english-words) (Unlicense) → Firestore `lemmas` (~370k).
2. **Historical definitions:** [Webster's Unabridged](https://github.com/ssvivian/WebstersDictionary) year-stamped (**1913** by default) → `entries` + `definitionEditions`.
3. **Primary modern senses:** Open English Wordnet.
4. **Broader coverage / examples:** Kaikki English Wiktionary JSONL.
5. **Simpler wording:** Simple English extract.
6. Merge by lemma; keep sense IDs distinct; never overwrite `editorialLocked`.
7. **Definition history:** when wording changes, **append** a new edition (`year` + content hash). Old years stay forever so you can backfill earlier corpora later.

Licenses: OEW **CC BY 4.0** + Princeton; Wiktionary **CC BY-SA**; dwyl **Unlicense**; Webster text **Project Gutenberg License**.

## APIs (owner token)

```http
POST /api/owner/dictionary/register
{ "token": "<OWNER_SEED_TOKEN>" }

POST /api/owner/dictionary/fetch
{ "token": "<OWNER_SEED_TOKEN>", "url": "https://…", "objectPath": "dictionary/sources/…" }

POST /api/owner/dictionary/import-kaikki
{ "token": "<OWNER_SEED_TOKEN>", "maxEntries": 500 }

POST /api/owner/dictionary/import-wordnet
{ "token": "<OWNER_SEED_TOKEN>", "maxEntries": 300, "letterPrefix": "a" }

POST /api/owner/dictionary/import-dwyl
{ "token": "<OWNER_SEED_TOKEN>", "maxEntries": 8000, "letterPrefix": "a" }

POST /api/owner/dictionary/import-websters
{ "token": "<OWNER_SEED_TOKEN>", "maxEntries": 3000, "letterPrefix": "a", "asOfYear": 1913 }
```

### Year-stamped definitions

| Field / path | Role |
|--------------|------|
| `sense.definition` + `sense.asOfYear` | Preferred display wording |
| `sense.definitionHistory[]` | Recent inline snapshots |
| `entries/{id}/definitionEditions/{year}_websters_{i}_{hash}` | Full archive; reimport with same hash is a no-op; new hash = new edition |
| `entry.definitionYears[]` | Years present on this lemma |

Optional `objectPath` for Simple English:

`dictionary/sources/kaikki/simple-extract.jsonl.gz`

## Upload without local storage

Use **cmd.exe** for pipes on Windows (PowerShell corrupts binary gzip → `1F 3F` instead of `1F 8B`).

```bash
# Already on machine → GCS
gcloud storage cp path\to\english-wordnet-2019.zip \
  gs://coloringdictionary.firebasestorage.app/dictionary/sources/open-english-wordnet/

# Remote → GCS (stream; no local file) — cmd.exe required on Windows
cmd /c "curl.exe -L --fail URL | gcloud storage cp - gs://…/object"
```

Simple English URL: `https://kaikki.org/dictionary/downloads/simple/simple-extract.jsonl.gz`  
English URL: `https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz`
