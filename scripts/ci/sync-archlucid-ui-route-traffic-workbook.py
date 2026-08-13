#!/usr/bin/env python3
"""Reconcile the owner UI route traffic workbook with the live route catalog."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

from archlucid_ui_route_catalog import (
    DEFAULT_NEW_HIT_PCT,
    PREFERRED_NEW_ROW_IDS,
    TRAFFIC_TRACKED_REDIRECT_BOOKMARKS,
    WORKBOOK_COLLISION_PREFERRED_ROW_IDS,
    app_router_page_count,
    build_catalog,
    discover_tab_paths,
    migrate_workbook_path,
    suggest_row_id,
)
from archlucid_ui_route_traffic_table import (
    DOC,
    ensure_owner_workbook,
    format_score_cell,
    parse_hit_pct,
    parse_rows,
    parse_score_series,
    sort_rows,
    split_document,
    write_table,
)


@dataclass
class SyncReport:
    migrated: list[tuple[str, str]] = field(default_factory=list)
    removed: list[str] = field(default_factory=list)
    added: list[str] = field(default_factory=list)
    retained: int = 0


_LEGACY_MERGE_STUB_NOTES = re.compile(
    r"(?i)\bdeprecated\b|\bmerged to\b|legacy .+ bookmark|canonical .+ is [A-Z]{2,}",
)


def _is_legacy_merge_stub(notes: str) -> bool:
    """True when Notes only document a redirect stub that collided onto a live path."""
    return bool(_LEGACY_MERGE_STUB_NOTES.search(notes or ""))


def _merge_score_series(existing: dict[str, str], incoming: dict[str, str]) -> str:
    existing_series = parse_score_series(existing)
    incoming_series = parse_score_series(incoming)
    length = max(len(existing_series), len(incoming_series))
    merged = [
        max(
            existing_series[index] if index < len(existing_series) else 0,
            incoming_series[index] if index < len(incoming_series) else 0,
        )
        for index in range(length)
    ]
    return format_score_cell(merged)


def _merge_rows(existing: dict[str, str], incoming: dict[str, str]) -> dict[str, str]:
    # Prefer the live canonical row (ID + Notes) when a legacy redirect stub collides.
    existing_stub = _is_legacy_merge_stub(existing.get("notes", ""))
    incoming_stub = _is_legacy_merge_stub(incoming.get("notes", ""))
    if existing_stub and not incoming_stub:
        base = incoming.copy()
        other = existing
    else:
        base = existing.copy()
        other = incoming

    merged = base
    merged["score"] = _merge_score_series(merged, other)
    merged_pct = parse_hit_pct(merged["pct"]) + parse_hit_pct(other["pct"])
    merged["pct"] = f"{merged_pct:g}%"
    if merged.get("notes", "None") == "None" and other.get("notes", "None") != "None":
        merged["notes"] = other["notes"]
    return merged


def _apply_migrations(rows: list[dict[str, str]], report: SyncReport) -> list[dict[str, str]]:
    by_path: dict[str, dict[str, str]] = {}
    for row in rows:
        original_path = row["path"]
        # Keep next.config-only bookmarks that the catalog still tracks explicitly.
        if original_path in TRAFFIC_TRACKED_REDIRECT_BOOKMARKS:
            migrated_path = original_path
        else:
            migrated_path = migrate_workbook_path(original_path)

        if migrated_path != original_path:
            report.migrated.append((original_path, migrated_path))
        candidate = row.copy()
        candidate["path"] = migrated_path
        if migrated_path in by_path:
            merged = _merge_rows(by_path[migrated_path], candidate)
            preferred_id = WORKBOOK_COLLISION_PREFERRED_ROW_IDS.get(migrated_path)
            if preferred_id is not None:
                merged["id"] = preferred_id
            by_path[migrated_path] = merged
        else:
            by_path[migrated_path] = candidate
    return list(by_path.values())


def sync_rows(existing_rows: list[dict[str, str]]) -> tuple[list[dict[str, str]], SyncReport]:
    catalog = build_catalog()
    catalog_paths = set(catalog)
    report = SyncReport()
    migrated_rows = _apply_migrations(existing_rows, report)

    retained_by_path: dict[str, dict[str, str]] = {}
    for row in migrated_rows:
        if row["path"] in catalog_paths:
            retained_by_path[row["path"]] = row
        else:
            report.removed.append(row["path"])

    report.retained = len(retained_by_path)
    used_ids = {row["id"] for row in retained_by_path.values()}

    for path in sorted(catalog_paths):
        if path in retained_by_path:
            retained_by_path[path]["section"] = catalog[path].section
            continue
        entry = catalog[path]
        preferred = PREFERRED_NEW_ROW_IDS.get(path)
        if preferred and preferred not in used_ids:
            row_id = preferred
        else:
            row_id = suggest_row_id(path, used_ids)
        used_ids.add(row_id)
        retained_by_path[path] = {
            "id": row_id,
            "path": path,
            "pct": DEFAULT_NEW_HIT_PCT,
            "score": "0",
            "section": entry.section,
            "done": "No",
            "notes": "None",
        }
        report.added.append(path)

    return sort_rows(list(retained_by_path.values())), report


def _update_source_line(before: str, page_count: int, tab_count: int) -> str:
    pattern = (
        r"Source: Next\.js App Router pages under archlucid-ui/src/app/ \(\d+ page\.tsx\n"
        r"files\) plus registered help topics in product-documentation-registry\.ts\."
    )
    replacement = (
        "Source: Next.js App Router pages under archlucid-ui/src/app/ "
        f"({page_count} page.tsx files) plus registered help topics in "
        "product-documentation-registry.ts and URL-tab surfaces (`?tab=`, `?path=`, `?archTab=`)."
    )
    updated, count = re.subn(pattern, replacement, before, count=1)
    if count:
        return updated

    fallback = re.sub(
        r"\(\d+ page\.tsx\nfiles\)",
        f"({page_count} page.tsx\nfiles)",
        before,
        count=1,
    )
    if "URL-tab surfaces" not in fallback and tab_count:
        fallback = fallback.replace(
            "product-documentation-registry.ts.",
            "product-documentation-registry.ts and URL-tab surfaces "
            "(`?tab=`, `?path=`, `?archTab=`).",
            1,
        )
    return fallback


def sync_document(doc: Path, *, dry_run: bool = False) -> SyncReport:
    text = doc.read_text(encoding="utf-8")
    before, table_body, after = split_document(text, doc)
    existing_rows = parse_rows(table_body)
    synced_rows, report = sync_rows(existing_rows)

    before = _update_source_line(
        before,
        page_count=app_router_page_count(),
        tab_count=len(discover_tab_paths()),
    )

    if not dry_run:
        write_table(doc, before, synced_rows, after)
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--doc",
        type=Path,
        default=DOC,
        help="Owner workbook path (default: .local/owner/ui_route_traffic_estimates.md)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Print changes without writing")
    args = parser.parse_args()

    doc = ensure_owner_workbook() if args.doc == DOC else args.doc.resolve()
    if not doc.is_file():
        print(f"sync-archlucid-ui-route-traffic-workbook: missing {doc}", file=sys.stderr)
        return 1

    report = sync_document(doc, dry_run=args.dry_run)
    mode = "Would sync" if args.dry_run else "Synced"
    print(f"{mode} {doc}")
    print(f"  retained: {report.retained}")
    print(f"  migrated: {len(report.migrated)}")
    print(f"  removed:  {len(report.removed)}")
    print(f"  added:    {len(report.added)}")
    if report.migrated:
        print("  migrations:")
        for old, new in report.migrated:
            print(f"    {old} -> {new}")
    if report.removed:
        print("  removed paths:")
        for path in report.removed:
            print(f"    {path}")
    if report.added:
        print("  added paths:")
        for path in report.added:
            print(f"    {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
