#!/usr/bin/env python3
"""Stream Open English Wordnet JSON ZIP → compact dictionary seed (no full extract)."""
from __future__ import annotations

import argparse
import gzip
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ZIP = Path.home() / "Downloads" / "english-wordnet-2025-json.zip"

POS_LABEL = {
    "n": "noun",
    "v": "verb",
    "a": "adjective",
    "s": "adjective",
    "r": "adverb",
}

SOURCE = {
    "label": "Open English Wordnet",
    "datasetVersion": "2025",
    "license": "CC BY 4.0 (with Princeton WordNet terms)",
    "attributionRequired": True,
    "attributionText": (
        "Definitions from Open English Wordnet 2025 (CC BY 4.0), based on "
        "Princeton WordNet. Adaptations for Coloring Dictionary will be marked separately."
    ),
    "url": "https://en-word.net/",
}


def slug_lemma(lemma: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", lemma.lower().strip()).strip("-")
    return (s[:80] if s else "unknown")


def entry_id(lemma: str) -> str:
    return f"dict_{slug_lemma(lemma)}"


def sense_id(raw_id: str | None, synset_id: str, lemma: str, pos: str) -> str:
    if raw_id:
        safe = re.sub(r"[^a-zA-Z0-9]+", "_", raw_id)
        return f"sense_{safe}"
    return f"sense_{slug_lemma(lemma)}_{pos}_{re.sub(r'[^a-z0-9]+', '_', synset_id)}"


def is_starter_lemma(lemma: str) -> bool:
    if not re.match(r"^[A-Za-z][A-Za-z'-]*$", lemma):
        return False
    if len(lemma) < 2 or len(lemma) > 18:
        return False
    return True


def load_json_member(zf: ZipFile, name: str):
    with zf.open(name) as fh:
        return json.load(fh)


def main() -> int:
    ap = argparse.ArgumentParser(description="Import Open English Wordnet into Coloring Dictionary seed")
    ap.add_argument("zip", nargs="?", default=str(DEFAULT_ZIP), help="Path to english-wordnet-2025-json.zip")
    ap.add_argument("--limit", type=int, default=0, help="Max dictionary entries (0 = no limit)")
    ap.add_argument(
        "--letters",
        default="",
        help="Optional letter filter, e.g. abc (only entries-a/b/c)",
    )
    args = ap.parse_args()
    zip_path = Path(args.zip)
    limit = args.limit if args.limit > 0 else None
    letters = set(args.letters.lower()) if args.letters else None

    if not zip_path.is_file():
        print(f"ZIP not found: {zip_path}", file=sys.stderr)
        return 1

    out_dir = ROOT / "data" / "dictionary"
    public_dir = ROOT / "public" / "data" / "seed"
    out_dir.mkdir(parents=True, exist_ok=True)
    public_dir.mkdir(parents=True, exist_ok=True)

    retrieved_at = datetime.now(timezone.utc).isoformat()
    synsets: dict[str, dict] = {}

    with ZipFile(zip_path, "r") as zf:
        names = zf.namelist()
        synset_files = sorted(n for n in names if re.match(r"^(noun|verb|adj|adv)\.", n))
        entry_files = sorted(n for n in names if n.startswith("entries-"))

        print(f"Synset files: {len(synset_files)}  entry files: {len(entry_files)}")
        for name in synset_files:
            print(f"  synset {name}…", end=" ", flush=True)
            data = load_json_member(zf, name)
            count = 0
            for sid, row in data.items():
                defs = row.get("definition") or []
                definition = "; ".join(d for d in defs if d).strip()
                if not definition:
                    continue
                examples = [e for e in (row.get("example") or []) if e]
                synsets[sid] = {
                    "definition": definition,
                    "examples": examples,
                    "pos": row.get("partOfSpeech") or "",
                    "members": row.get("members") or [],
                }
                count += 1
            print(count)
        print(f"Synsets loaded: {len(synsets)}")

        gz_path = out_dir / "oew-2025.entries.ndjson.gz"
        entries_written = 0
        senses_written = 0
        lemmas_seen = 0
        skipped_no_synset = 0
        pos_counts: dict[str, int] = {}
        preview: list[dict] = []

        with gzip.open(gz_path, "wt", encoding="utf-8", compresslevel=6) as out:
            for name in entry_files:
                if limit is not None and entries_written >= limit:
                    break
                letter = name.replace("entries-", "").replace(".json", "")
                if letters and letter not in letters and letter != "0":
                    # keep entries-0 only if '0' requested; skip other filtered
                    if letter != "0":
                        continue

                print(f"  entries {name}…", end=" ", flush=True)
                data = load_json_member(zf, name)
                file_count = 0
                for lemma, pos_map in data.items():
                    if limit is not None and entries_written >= limit:
                        break
                    lemmas_seen += 1
                    if not is_starter_lemma(lemma):
                        continue

                    senses: list[dict] = []
                    for pos, bundle in (pos_map or {}).items():
                        sense_list = (bundle or {}).get("sense") or []
                        pronunciations = (bundle or {}).get("pronunciation") or []
                        pronunciation = None
                        for p in pronunciations:
                            if p.get("variety") == "US":
                                pronunciation = p.get("value")
                                break
                        if pronunciation is None and pronunciations:
                            pronunciation = pronunciations[0].get("value")

                        for s in sense_list:
                            syn = synsets.get(s.get("synset"))
                            if not syn:
                                skipped_no_synset += 1
                                continue
                            pos_label = POS_LABEL.get(pos, pos)
                            pos_counts[pos_label] = pos_counts.get(pos_label, 0) + 1
                            gap_flags = ["needs_publication_adaptation", "needs_illustration_brief"]
                            if not syn["examples"]:
                                gap_flags.append("needs_example")
                            senses.append(
                                {
                                    "id": sense_id(s.get("id"), s.get("synset", ""), lemma, pos),
                                    "partOfSpeech": pos_label,
                                    "definition": syn["definition"],
                                    "definitionSource": "oew_2025",
                                    "publicationAdaptation": None,
                                    "examples": syn["examples"][:3],
                                    "pronunciation": pronunciation,
                                    "synsetId": s.get("synset"),
                                    "wordnetSenseId": s.get("id"),
                                    "gapFlags": gap_flags,
                                    "sourceLayers": [
                                        {
                                            "provider": "open_english_wordnet",
                                            "datasetVersion": "2025",
                                            "sourceId": s.get("id") or s.get("synset"),
                                            "role": "primary_definition",
                                        }
                                    ],
                                }
                            )
                            senses_written += 1

                    if not senses:
                        continue

                    entry = {
                        "id": entry_id(lemma),
                        "entryType": "dictionary",
                        "lemma": lemma,
                        "language": "en",
                        "senses": senses,
                        "verificationStatus": "imported_unverified",
                        "editorialLocked": False,
                        "synthesis": {
                            "strategy": "fill_gaps_from_sources",
                            "primarySource": "open_english_wordnet",
                            "pendingSources": ["kaikki_en", "simple_wiktionary"],
                        },
                        "sources": [
                            {
                                **SOURCE,
                                "sourceId": f"lemma:{lemma}",
                                "retrievedAt": retrieved_at,
                            }
                        ],
                        "provenance": [
                            {
                                "workbook": zip_path.name,
                                "sheet": name,
                                "importedAt": retrieved_at,
                            }
                        ],
                    }
                    out.write(json.dumps(entry, ensure_ascii=False) + "\n")
                    entries_written += 1
                    file_count += 1
                    if len(preview) < 120:
                        preview.append(entry)
                print(f"{file_count} entries")

    manifest = {
        "importedAt": retrieved_at,
        "brandPromise": "A dictionary that you can color.",
        "source": SOURCE,
        "zip": zip_path.name,
        "counts": {
            "lemmasScanned": lemmas_seen,
            "entriesWritten": entries_written,
            "sensesWritten": senses_written,
            "synsetsLoaded": len(synsets),
            "skippedNoSynset": skipped_no_synset,
            "byPartOfSpeech": pos_counts,
            "limit": limit,
            "letters": args.letters or None,
        },
        "outputs": {
            "compressedEntries": "data/dictionary/oew-2025.entries.ndjson.gz",
            "preview": "public/data/seed/dictionary-preview.json",
            "manifest": "public/data/seed/dictionary-manifest.json",
        },
        "notes": [
            "Starter filter: alphabetic lemmas (2–18 chars). Multiword phrases deferred.",
            "Each sense is a stable illustration target; books must pin sense IDs.",
            "publicationAdaptation stays empty until editorial rewrite; reimport must not overwrite editorialLocked.",
            "Next: merge Kaikki / Simple Wiktionary for missing examples and simpler wording.",
            "AI rewrite does not remove CC BY / WordNet attribution obligations.",
        ],
    }

    (public_dir / "dictionary-manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    (public_dir / "dictionary-preview.json").write_text(
        json.dumps(preview, indent=2), encoding="utf-8"
    )

    gz_mb = (out_dir / "oew-2025.entries.ndjson.gz").stat().st_size / (1024 * 1024)
    print("\nDone.")
    print(json.dumps(manifest["counts"], indent=2))
    print(f"Wrote data/dictionary/oew-2025.entries.ndjson.gz ({gz_mb:.2f} MB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
