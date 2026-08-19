#!/usr/bin/env python3
"""Fail when the tracked route-traffic workbook diverges from the canonical route catalog."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from archlucid_ui_route_catalog import (
    TRAFFIC_TRACKED_REDIRECT_BOOKMARKS,
    WORKBOOK_PATH_MIGRATIONS,
    build_catalog,
    migrate_workbook_path,
)
from archlucid_ui_route_traffic_table import REPO_ROOT, TEMPLATE_DOC, parse_rows, split_document

# Tracked next.config bookmarks may remain as workbook rows; other migration keys must not.
REDIRECT_ONLY_PATHS = frozenset(WORKBOOK_PATH_MIGRATIONS.keys()) - TRAFFIC_TRACKED_REDIRECT_BOOKMARKS


def _effective_workbook_path(path: str) -> str:
    """Keep traffic-tracked redirect bookmarks; migrate every other legacy path."""
    if path in TRAFFIC_TRACKED_REDIRECT_BOOKMARKS:
        return path

    return migrate_workbook_path(path)


def workbook_paths(doc: Path) -> tuple[list[str], list[str]]:
    """Return (raw paths, migrated paths) from the workbook master table."""
    text = doc.read_text(encoding="utf-8")
    _, table_body, _ = split_document(text, doc)
    rows = parse_rows(table_body)
    raw_paths = [row["path"] for row in rows]
    migrated_paths = [_effective_workbook_path(path) for path in raw_paths]
    return raw_paths, migrated_paths


def assert_workbook_canonical(doc: Path) -> list[str]:
    errors: list[str] = []
    raw_paths, migrated_paths = workbook_paths(doc)
    workbook_set = set(migrated_paths)
    catalog_paths = set(build_catalog().keys())

    unmigrated = sorted({path for path in raw_paths if path in REDIRECT_ONLY_PATHS})
    if unmigrated:
        errors.append(
            "workbook still lists redirect-only legacy paths (use canonical nav hrefs): "
            + ", ".join(unmigrated)
        )

    if len(migrated_paths) != len(workbook_set):
        duplicates = sorted({path for path in migrated_paths if migrated_paths.count(path) > 1})
        errors.append("duplicate workbook paths after migration: " + ", ".join(duplicates))

    extra = sorted(workbook_set - catalog_paths)
    if extra:
        preview = ", ".join(extra[:12])
        suffix = f" (+{len(extra) - 12} more)" if len(extra) > 12 else ""
        errors.append(f"workbook paths not in canonical catalog: {preview}{suffix}")

    missing = sorted(catalog_paths - workbook_set)
    if missing:
        preview = ", ".join(missing[:12])
        suffix = f" (+{len(missing) - 12} more)" if len(missing) > 12 else ""
        errors.append(f"canonical catalog paths missing from workbook: {preview}{suffix}")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--doc",
        type=Path,
        default=TEMPLATE_DOC,
        help="Workbook markdown path (default: tracked bootstrap template)",
    )
    args = parser.parse_args()
    doc = args.doc.resolve()
    if not doc.is_file():
        print(f"assert_ui_route_traffic_workbook_canonical: missing {doc}", file=sys.stderr)
        return 1

    errors = assert_workbook_canonical(doc)
    if errors:
        print("assert_ui_route_traffic_workbook_canonical: FAILED", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        print(
            "  Hint: python scripts/ci/sync-archlucid-ui-route-traffic-workbook.py "
            f"--doc {doc.relative_to(REPO_ROOT).as_posix()}",
            file=sys.stderr,
        )
        return 1

    _, migrated_paths = workbook_paths(doc)
    print(
        "assert_ui_route_traffic_workbook_canonical: OK "
        f"({len(migrated_paths)} workbook row(s) match canonical catalog)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
