#!/usr/bin/env python3
"""List the lowest UX-scored buyer-facing rows in the owner traffic workbook."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from archlucid_ui_route_traffic_table import (
    DOC,
    ensure_owner_workbook,
    lowest_ux_buyer_rows,
    parse_rows,
    parse_ux_score,
    split_document,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "List non-/internal routes with the lowest UX scores (Scores position 2), "
            "sorted ascending."
        ),
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=20,
        help="How many rows to return (default: 20)",
    )
    parser.add_argument(
        "--doc",
        type=Path,
        default=DOC,
        help="Path to ui_route_traffic_estimates.md",
    )
    return parser


def format_markdown_table(rows: list[dict[str, str]]) -> str:
    lines = [
        "| Rank | ID | UX | Hit% | Section | Path |",
        "|------|-----|-----|------|---------|------|",
    ]

    for index, row in enumerate(rows, start=1):
        lines.append(
            f"| {index} | {row['id']} | {parse_ux_score(row)} | {row['pct']} | "
            f"{row['section']} | `{row['path']}` |"
        )

    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.limit < 1:
        print("limit must be at least 1", file=sys.stderr)
        return 2

    doc_path = ensure_owner_workbook() if args.doc == DOC else args.doc
    text = doc_path.read_text(encoding="utf-8")
    rows = parse_rows(split_document(text, doc_path)[1])
    lowest = lowest_ux_buyer_rows(rows, limit=args.limit)

    if not lowest:
        print("No buyer-facing rows with a scored UX dimension were found.")
        return 0

    print(format_markdown_table(lowest))
    print()
    print(
        f"Source: {doc_path} - {len(lowest)} row(s); "
        "excludes `/internal/*`, Internal-section rows, internal-runbook help exclusions, "
        "and rows with UX score 0 (unscored)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
