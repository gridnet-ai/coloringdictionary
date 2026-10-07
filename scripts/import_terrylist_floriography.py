#!/usr/bin/env python3
"""Convert TerryList flowers.json → Coloring Dictionary floriography seed JSON."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TERRY_FLOWERS = Path(r"C:\terrylist\public\data\flowers.json")
TERRY_1884 = Path(r"C:\terrylist\data\knowledge\dictionary-1884.json")
OUT_DIRS = [ROOT / "public" / "data" / "seed", ROOT / "data" / "seed"]


def map_flower(f: dict) -> dict:
    slug = f.get("slug") or ""
    pub = (f.get("publication_status") or "draft").lower()
    if pub not in ("draft", "reviewed", "approved", "rejected", "published"):
        pub = "draft"
    research = (f.get("research_status") or "").lower()
    if "verified" in research:
        vstat = "verified"
    elif "reject" in research:
        vstat = "rejected"
    elif "review" in research:
        vstat = "needs_review"
    else:
        vstat = "imported_unverified"

    src_obj = f.get("source") or {}
    sources = []
    if src_obj:
        author = src_obj.get("author") or "Kate Greenaway"
        title = src_obj.get("title") or "Language of Flowers"
        year = src_obj.get("year") or "1884"
        sources.append(
            {
                "label": title,
                "url": src_obj.get("url"),
                "license": "Public domain / attributed historical source",
                "attributionRequired": True,
                "attributionText": f"{author} — {title} ({year})",
            }
        )
    sources.append(
        {
            "label": "TerryList flower catalog",
            "url": "https://terrylist.com",
            "attributionRequired": True,
            "attributionText": (
                "Flower meanings catalog copied from TerryList "
                "for the Coloring Dictionary floriography database."
            ),
        }
    )

    art = f.get("artwork") or {}
    file_loc = art.get("original_image") or art.get("transparent_asset")
    return {
        "id": f"flower_{slug}",
        "entryType": "flower_meaning",
        "slug": slug,
        "name": f.get("common_name") or f.get("historical_name") or slug,
        "historicalName": f.get("historical_name"),
        "botanicalName": f.get("botanical_name"),
        "catalogNumber": f.get("catalog_number"),
        "meanings": {
            "historical1884": f.get("historical_meaning_1884"),
            "terryList": f.get("terrylist_meaning"),
            "almanac": None,
            "almanacNotes": None,
            "modern": f.get("terrylist_meaning"),
            "publicationAdaptation": f.get("message"),
        },
        "signatureLine": f.get("message"),
        "alternateMessages": f.get("alternate_messages") or [],
        "whenToSend": f.get("when_to_send"),
        "emotionalLanes": f.get("emotional_lanes") or [],
        "matchStatus": f.get("interpretation_tier"),
        "verificationStatus": vstat,
        "publicationStatus": "published" if f.get("indexable") else pub,
        "editorialLocked": False,
        "sources": sources,
        "provenance": [
            {
                "workbook": "terrylist/public/data/flowers.json",
                "importedAt": "2026-10-07",
            }
        ],
        "artwork": {
            "status": None,
            "fileLocation": file_loc,
            "instagramReel": None,
            "availability": "external_link" if file_loc else "unknown",
        },
        "legacyStatus": f.get("product_status"),
        "legacyPublished": f.get("publication_tier"),
        "origin": f.get("origin"),
        "productEligibility": f.get("product_eligibility"),
        "priority": f.get("priority"),
        "editorNote": f.get("editor_note"),
        "verificationFlags": f.get("verification_flags") or [],
        "indexable": bool(f.get("indexable")),
        "database": "floriography",
    }


def main() -> None:
    flowers_raw = json.loads(TERRY_FLOWERS.read_text(encoding="utf-8"))
    if not isinstance(flowers_raw, list):
        raise SystemExit("Expected TerryList flowers.json to be a list")

    mapped = [map_flower(f) for f in flowers_raw]
    manifest = {
        "database": "floriography",
        "databaseLabel": "Flower Meaning / Floriography",
        "source": str(TERRY_FLOWERS),
        "count": len(mapped),
        "importedAt": "2026-10-07",
    }

    for out in OUT_DIRS:
        out.mkdir(parents=True, exist_ok=True)
        (out / "floriography-flowers.json").write_text(
            json.dumps(mapped, ensure_ascii=False), encoding="utf-8"
        )
        (out / "floriography-manifest.json").write_text(
            json.dumps(manifest, indent=2), encoding="utf-8"
        )

    if TERRY_1884.exists():
        raw1884 = json.loads(TERRY_1884.read_text(encoding="utf-8"))
        for out in OUT_DIRS:
            (out / "floriography-dictionary-1884.json").write_text(
                json.dumps(raw1884, ensure_ascii=False), encoding="utf-8"
            )
        print(f"wrote 1884 dictionary ({len(raw1884) if isinstance(raw1884, list) else 'ok'})")

    print(f"wrote {len(mapped)} floriography flowers")


if __name__ == "__main__":
    main()
