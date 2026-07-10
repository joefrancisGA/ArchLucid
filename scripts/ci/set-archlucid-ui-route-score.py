#!/usr/bin/env python3
"""Update an ArchLucid UI route Evidence score by table ID and re-sort the master table."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from archlucid_ui_route_traffic_table import (
    DOC,
    ensure_owner_workbook,
    find_row,
    parse_rows,
    sort_rows,
    split_document,
    update_method_line,
    weight,
    write_table,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Set UI route score by table ID.")
    parser.add_argument("id", help="Table ID shorthand (e.g. ASK, GFN)")
    parser.add_argument("score", type=int, help="Evidence score (0-100)")
    parser.add_argument(
        "--doc",
        type=Path,
        default=DOC,
        help="Path to ui_route_traffic_estimates.md",
    )
    args = parser.parse_args()

    if args.score < 0 or args.score > 100:
        print("Score must be between 0 and 100.", file=sys.stderr)
        return 1

    row_id = args.id.strip().upper()
    doc_path = ensure_owner_workbook() if args.doc == DOC else args.doc
    text = doc_path.read_text(encoding="utf-8")
    before, table_body, after = split_document(text, doc_path)
    rows = parse_rows(table_body)

    if not rows:
        print("No table rows found.", file=sys.stderr)
        return 1

    match = find_row(rows, row_id)
    if match is None:
        known = ", ".join(sorted({row["id"] for row in rows})[:20])
        print(f"Unknown ID '{row_id}'. Examples: {known}, ...", file=sys.stderr)
        return 1

    previous = match["score"]
    match["score"] = str(args.score)
    rows = sort_rows(rows)
    before = update_method_line(before)
    write_table(doc_path, before, rows, after)

    updated = find_row(rows, row_id)
    if updated is None:
        print("Updated row missing after resort.", file=sys.stderr)
        return 1

    print(
        f"Updated {row_id} ({updated['path']}): score {previous} -> {args.score}; "
        f"weight={weight(updated):g}; rank={rows.index(updated) + 1}/{len(rows)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
