# Dictionary sources — Open English Wordnet & Wiktionary

There is no single complete “entire dictionary.” Start with structured English senses, then broaden.

## Recommended pipeline

| Priority | Source | Format | Use |
|----------|--------|--------|-----|
| 1 | Open English Wordnet | JSON ZIP / XML | Initial English definitions + relations |
| 2 | Kaikki / English Wiktionary | JSONL | Broader coverage, senses, pronunciations |
| 3 | Simple English Wiktionary | JSONL | Simpler wording for learning guides |

Open English Wordnet download includes `english-wordnet-2025-json.zip`.  
Kaikki: [https://kaikki.org](https://kaikki.org) — check both **word language** and **definition language**.

## Licensing (selling books)

| Source | License notes |
|--------|----------------|
| Open English Wordnet | **CC BY 4.0** + underlying Princeton WordNet terms — retain notices, credit sources, mark adaptations |
| Wiktionary / Kaikki | Attribution + share-alike obligations carry through when reusing or adapting |

**AI rewriting does not remove license obligations.** Store:

- `license`, `attributionRequired`, `attributionText`
- `datasetVersion`, `retrievedAt`, `sourceId` / URL
- original definition vs `publicationAdaptation`
- verification status

## Import plan (next milestone)

1. Download OEW JSON; map lemma → senses → `DictionaryEntry` / `DictionarySense`.
2. Deduplicate by lemma + POS + sense fingerprint.
3. Optional Kaikki merge for missing lemmas / examples.
4. Theme collections select **sense IDs**, not just headwords.
5. Export attribution pages for every print edition.

Do not mark Wordnet/Wiktionary imports as verified for publication until editorial review.
