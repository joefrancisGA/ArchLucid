#!/usr/bin/env python3
"""Re-sort the UI route traffic estimates master table using the current sort_key rules."""

from __future__ import annotations

import argparse
from pathlib import Path

from archlucid_ui_route_traffic_table import (
    DOC,
    ensure_owner_workbook,
    format_overall_weight_total,
    parse_rows,
    sort_rows,
    split_document,
    write_table,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Re-sort ui_route_traffic_estimates.md master table.")
    parser.add_argument("--doc", type=Path, default=DOC, help="Path to ui_route_traffic_estimates.md")
    args = parser.parse_args()

    doc_path = ensure_owner_workbook() if args.doc == DOC else args.doc
    text = doc_path.read_text(encoding="utf-8")
    before, table_body, after = split_document(text, doc_path)
    rows = sort_rows(parse_rows(table_body))
    write_table(doc_path, before, rows, after)

    print(f"Re-sorted {len(rows)} rows; OVERALL WEIGHT SCORE={format_overall_weight_total(rows)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
