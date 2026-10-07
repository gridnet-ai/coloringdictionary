#!/usr/bin/env python3
"""Staged import: Excel workbooks → seed JSON for Firestore."""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "seed"
TL_XLSX = Path(r"c:\Users\later\Downloads\terry-list-dictionary-master.xlsx")
TRACKER_XLSX = Path(r"c:\Users\later\Downloads\Coloring-Dictionary-Production-Tracker.xlsx")


def slugify(s: str) -> str:
    s = (s or "").strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "unknown"


def cell_str(v):
    if v is None:
        return None
    if isinstance(v, str):
        v = v.strip()
        return v or None
    return v


def rows_as_dicts(ws):
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return [], []
    headers = [str(x).strip() if x is not None else f"col{i}" for i, x in enumerate(rows[0])]
    out = []
    for r in rows[1:]:
        if not any(c is not None and str(c).strip() for c in r):
            continue
        out.append({headers[i]: (r[i] if i < len(r) else None) for i in range(len(headers))})
    return headers, out


def parse_book_sheet(ws):
    rows = list(ws.iter_rows(values_only=True))
    meta: dict = {}
    pages: list = []
    mode = "meta"
    page_headers = None
    for r in rows:
        vals = list(r)
        if not any(v is not None and str(v).strip() for v in vals):
            continue
        key = str(vals[0]).strip() if vals[0] is not None else ""
        if key.upper() == "PAGES":
            mode = "pages"
            continue
        if key == "Page #":
            mode = "pages"
            page_headers = [
                str(c).strip() if c is not None else f"col{i}" for i, c in enumerate(vals)
            ]
            continue
        if mode == "meta" and key and key.upper() != "BOOK":
            meta[key] = cell_str(vals[1]) if len(vals) > 1 else None
        elif mode == "pages" and page_headers:
            page = {}
            for i, hname in enumerate(page_headers):
                if not hname:
                    continue
                page[hname] = vals[i] if i < len(vals) else None
            if page.get("Page #") is not None or page.get("Flower"):
                pages.append(page)
    return meta, pages


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    wb = openpyxl.load_workbook(TL_XLSX, data_only=True)

    _, dict_rows = rows_as_dicts(wb["Dictionary"])
    dict_entries = []
    for d in dict_rows:
        flower = cell_str(d.get("Flower"))
        if not flower:
            continue
        dict_entries.append(
            {
                "catalogNumber": cell_str(d.get("Catalog #")),
                "flower": flower,
                "botanicalName": cell_str(d.get("Botanical name")),
                "historicalMeaning1884": cell_str(d.get("Historical meaning (1884)")),
                "modernMeaning": cell_str(d.get("Modern Meaning")),
                "terryListMeaning": cell_str(d.get("Terry List meaning")),
                "signatureLine": cell_str(d.get("Signature line")),
                "whenToSend": cell_str(d.get("When to send")),
                "artworkStatus": cell_str(d.get("Artwork")),
                "status": cell_str(d.get("Status")),
                "published": cell_str(d.get("Published")),
                "source": cell_str(d.get("Source")),
                "fileLocation": cell_str(d.get("File Location")),
                "instagramReel": cell_str(d.get("Instagram Reel")),
                "provenance": {
                    "workbook": "terry-list-dictionary-master.xlsx",
                    "sheet": "Dictionary",
                },
            }
        )

    _, final_rows = rows_as_dicts(wb["Final Draft - Combined"])
    final_draft = []
    for d in final_rows:
        flower = cell_str(d.get("Flower"))
        if not flower:
            continue
        final_draft.append(
            {
                "flower": flower,
                "botanicalName": cell_str(d.get("Botanical name")),
                "catalogNumber": cell_str(d.get("Catalog #")),
                "historicalMeaning1884": cell_str(d.get("Historical meaning (1884)")),
                "terryListMeaning": cell_str(d.get("Terry List meaning")),
                "signatureLine": cell_str(d.get("Signature line")),
                "almanacMeaning": cell_str(d.get("Almanac meaning")),
                "almanacNotes": cell_str(d.get("Almanac distinctions / notes")),
                "matchStatus": cell_str(d.get("Match status")),
                "provenance": {
                    "workbook": "terry-list-dictionary-master.xlsx",
                    "sheet": "Final Draft - Combined",
                },
            }
        )

    almanacs = {}
    for sheet in [
        "Almanac Chart",
        "Almanac By Color",
        "Almanac By Meaning",
        "Almanac Victorian Era",
        "Almanac Wedding",
    ]:
        _, items = rows_as_dicts(wb[sheet])
        almanacs[sheet] = [
            {k: cell_str(v) if not isinstance(v, (int, float)) else v for k, v in row.items()}
            for row in items
        ]

    summary_snapshot = {
        "Total entries claimed on Summary sheet": 713,
        "Dictionary actual populated": len(dict_entries),
        "Final Draft actual populated": len(final_draft),
        "note": "Recalculated from records; do not trust older summary totals.",
    }
    wb.close()

    wb2 = openpyxl.load_workbook(TRACKER_XLSX, data_only=True)
    _, dashboard = rows_as_dicts(wb2["Dashboard"])
    dashboard = [
        {k: cell_str(v) if isinstance(v, str) else v for k, v in row.items()} for row in dashboard
    ]

    books = {}
    for sheet in ["Volume One", "Texas", "Christmas"]:
        meta, pages = parse_book_sheet(wb2[sheet])
        books[sheet] = {"meta": meta, "pages": pages, "pageCount": len(pages)}

    _, vol1_flowers = rows_as_dicts(wb2["Vol 1 Flowers"])
    vol1_flowers = [
        {k: cell_str(v) if isinstance(v, str) else v for k, v in row.items()}
        for row in vol1_flowers
        if cell_str(row.get("Flower"))
    ]

    _, covers = rows_as_dicts(wb2["Covers"])
    covers = [
        {k: cell_str(v) if isinstance(v, str) else v for k, v in row.items()} for row in covers
    ]
    wb2.close()

    by_key: dict = {}
    for e in final_draft:
        key = f"{e.get('catalogNumber') or ''}|{slugify(e['flower'])}"
        cat = e.get("catalogNumber") or slugify(e["flower"])
        by_key[key] = {
            "id": f"flower_{str(cat).lower().replace(' ', '-')}",
            "entryType": "flower_meaning",
            "slug": slugify(e["flower"]),
            "name": e["flower"],
            "botanicalName": e.get("botanicalName"),
            "catalogNumber": e.get("catalogNumber"),
            "meanings": {
                "historical1884": e.get("historicalMeaning1884"),
                "terryList": e.get("terryListMeaning"),
                "almanac": e.get("almanacMeaning"),
                "almanacNotes": e.get("almanacNotes"),
                "modern": None,
                "publicationAdaptation": None,
            },
            "signatureLine": e.get("signatureLine"),
            "matchStatus": e.get("matchStatus"),
            "verificationStatus": "imported_unverified",
            "sources": [],
            "provenance": [e["provenance"]],
            "artwork": {},
            "publicationStatus": "draft",
            "editorialLocked": False,
        }

    for e in dict_entries:
        key = f"{e.get('catalogNumber') or ''}|{slugify(e['flower'])}"
        if key in by_key:
            rec = by_key[key]
            if e.get("modernMeaning"):
                rec["meanings"]["modern"] = e["modernMeaning"]
            if e.get("whenToSend"):
                rec["whenToSend"] = e["whenToSend"]
            rec["artwork"] = {
                "status": e.get("artworkStatus"),
                "fileLocation": e.get("fileLocation"),
                "instagramReel": e.get("instagramReel"),
                "availability": "external_link" if e.get("fileLocation") else "unknown",
            }
            rec["legacyStatus"] = e.get("status")
            rec["legacyPublished"] = e.get("published")
            if e.get("source"):
                rec["sources"].append({"label": e["source"]})
            rec["provenance"].append(e["provenance"])
        else:
            cat = e.get("catalogNumber") or slugify(e["flower"])
            by_key[key] = {
                "id": f"flower_{str(cat).lower().replace(' ', '-')}",
                "entryType": "flower_meaning",
                "slug": slugify(e["flower"]),
                "name": e["flower"],
                "botanicalName": e.get("botanicalName"),
                "catalogNumber": e.get("catalogNumber"),
                "meanings": {
                    "historical1884": e.get("historicalMeaning1884"),
                    "terryList": e.get("terryListMeaning"),
                    "almanac": None,
                    "almanacNotes": None,
                    "modern": e.get("modernMeaning"),
                    "publicationAdaptation": None,
                },
                "signatureLine": e.get("signatureLine"),
                "whenToSend": e.get("whenToSend"),
                "verificationStatus": "imported_unverified",
                "sources": ([{"label": e["source"]}] if e.get("source") else []),
                "provenance": [e["provenance"]],
                "artwork": {
                    "status": e.get("artworkStatus"),
                    "fileLocation": e.get("fileLocation"),
                    "instagramReel": e.get("instagramReel"),
                    "availability": "external_link" if e.get("fileLocation") else "unknown",
                },
                "legacyStatus": e.get("status"),
                "legacyPublished": e.get("published"),
                "publicationStatus": "draft",
                "editorialLocked": False,
            }

    flowers = list(by_key.values())

    book_docs = []
    for name, data in books.items():
        meta = data["meta"]
        book_docs.append(
            {
                "id": slugify(name),
                "title": meta.get("Title") or "Coloring Dictionary",
                "subtitle": meta.get("Subtitle") or "Flower Meanings",
                "series": meta.get("Series") or "Coloring Dictionary",
                "edition": meta.get("Edition") or name,
                "authorImported": meta.get("Author"),
                "authorCreditNeedsConfirmation": True,
                "coverUrl": meta.get("Cover"),
                "format": meta.get("Format"),
                "status": meta.get("Status") or "concept",
                "language": "en",
                "audience": "For all ages",
                "spreadLayout": {"guideSide": "left_even", "coloringSide": "right_odd"},
                "pages": data["pages"],
                "pageCount": data["pageCount"],
                "provenance": {
                    "workbook": "Coloring-Dictionary-Production-Tracker.xlsx",
                    "sheet": name,
                },
                "pinnedAssetVersions": {},
                "creditsEditable": True,
            }
        )

    # Register known local creative assets
    local_assets = [
        {
            "id": "asset_cover_volume_one",
            "kind": "cover",
            "bookId": "volume-one",
            "path": "/assets/cover-volume-one.png",
            "status": "draft",
            "availability": "local",
            "isMarketingMockup": False,
        },
        {
            "id": "asset_cover_texas",
            "kind": "cover",
            "bookId": "texas",
            "path": "/assets/cover-texas.png",
            "status": "draft",
            "availability": "local",
            "isMarketingMockup": False,
        },
        {
            "id": "asset_cover_christmas",
            "kind": "cover",
            "bookId": "christmas",
            "path": "/assets/cover-christmas.png",
            "status": "draft",
            "availability": "local",
            "isMarketingMockup": False,
        },
        {
            "id": "asset_spread_white_clover",
            "kind": "marketing_preview",
            "path": "/assets/spread-white-clover.png",
            "status": "concept",
            "availability": "local",
            "isMarketingMockup": True,
            "note": "Open-book marketing mockup; not a finished interior page.",
        },
        {
            "id": "asset_flower_coreopsis",
            "kind": "guide_raster",
            "path": "/assets/flower-coreopsis.png",
            "status": "draft",
            "availability": "local",
            "isMarketingMockup": False,
            "printCheck": "pending",
        },
        {
            "id": "asset_flower_pink_carnation",
            "kind": "guide_raster",
            "path": "/assets/flower-pink-carnation.png",
            "status": "draft",
            "availability": "local",
            "printCheck": "pending",
        },
        {
            "id": "asset_flower_white_clover",
            "kind": "guide_raster",
            "path": "/assets/flower-white-clover.png",
            "status": "draft",
            "availability": "local",
            "printCheck": "pending",
        },
    ]

    now = datetime.now(timezone.utc).isoformat()
    manifest = {
        "importedAt": now,
        "brandPromise": "A dictionary that you can color.",
        "counts": {
            "flowers": len(flowers),
            "dictionarySheet": len(dict_entries),
            "finalDraftSheet": len(final_draft),
            "books": len(book_docs),
            "vol1FlowerSelections": len(vol1_flowers),
            "covers": len(covers),
            "localAssets": len(local_assets),
            "almanacSheets": {k: len(v) for k, v in almanacs.items()},
        },
        "summarySnapshot": summary_snapshot,
        "notes": [
            "Final Draft - Combined has 745 populated rows (recalculated).",
            "Terry List author credit imported and flagged for confirmation before release.",
            "Drive links retained as external references until files are confirmed available.",
            "Marketing mockups are separate from print-ready interior pages.",
            "editorialLocked protects reviewed fields from reimport overwrite.",
        ],
    }

    def dump(name, obj):
        (OUT / name).write_text(
            json.dumps(obj, indent=2, ensure_ascii=False, default=str), encoding="utf-8"
        )

    dump("manifest.json", manifest)
    dump("flowers.json", flowers)
    dump("books.json", book_docs)
    dump("dashboard.json", dashboard)
    dump("vol1-flowers.json", vol1_flowers)
    dump("covers.json", covers)
    dump("almanacs.json", almanacs)
    dump("assets.json", local_assets)
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
