#!/usr/bin/env python3
"""Update an ArchLucid UI route note by table ID."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from archlucid_ui_route_traffic_table import (
    DOC,
    ensure_owner_workbook,
    find_row,
    merge_note,
    parse_rows,
    split_document,
    write_table,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Set UI route note by table ID.")
    parser.add_argument("id", help="Table ID shorthand (e.g. ASK, GFN)")
    parser.add_argument("note", nargs="?", default="", help="Note text to add")
    parser.add_argument("--replace", action="store_true", help="Replace existing note")
    parser.add_argument("--clear", action="store_true", help="Clear note to None")
    parser.add_argument(
        "--doc",
        type=Path,
        default=DOC,
        help="Path to ui_route_traffic_estimates.md",
    )
    args = parser.parse_args()

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

    previous = match["notes"]

    if args.clear:
        match["notes"] = "None"
    else:
        if not args.note.strip() and not args.replace:
            print("Note text is required unless --clear is used.", file=sys.stderr)
            return 1

        match["notes"] = merge_note(previous, args.note, replace=args.replace)

    write_table(doc_path, before, rows, after)

    print(
        f"Updated {row_id} ({match['path']}): notes {previous!r} -> {match['notes']!r}; "
        f"rank={rows.index(match) + 1}/{len(rows)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
