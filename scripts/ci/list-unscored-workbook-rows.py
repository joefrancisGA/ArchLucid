#!/usr/bin/env python3
"""List unscored rows in the owner UI route traffic workbook."""

from __future__ import annotations

from pathlib import Path

from archlucid_ui_route_traffic_table import (
    DOC,
    parse_rows,
    parse_score,
    parse_ux_score,
    split_document,
)


def main() -> int:
    text = Path(DOC).read_text(encoding="utf-8")
    _, body, _ = split_document(text, DOC)
    rows = parse_rows(body)

    zero_both = [row for row in rows if parse_score(row) == 0 and parse_ux_score(row) == 0]
    zero_ux_only = [row for row in rows if parse_ux_score(row) == 0 and parse_score(row) > 0]
    zero_evidence_only = [row for row in rows if parse_score(row) == 0 and parse_ux_score(row) > 0]

    print(f"total_rows={len(rows)}")
    print(f"zero_both={len(zero_both)}")
    print(f"zero_ux_only={len(zero_ux_only)}")
    print(f"zero_evidence_only={len(zero_evidence_only)}")
    print()
    print("| ID | Evidence | UX | Section | Path |")
    print("|----|----------|-----|---------|------|")

    for row in sorted(zero_both + zero_ux_only, key=lambda item: item["path"]):
        print(
            f"| {row['id']} | {parse_score(row)} | {parse_ux_score(row)} | "
            f"{row['section']} | `{row['path']}` |"
        )

    if zero_evidence_only:
        print()
        print("## Evidence-only zeros (UX scored)")
        print()
        print("| ID | Evidence | UX | Section | Path |")
        print("|----|----------|-----|---------|------|")
        for row in sorted(zero_evidence_only, key=lambda item: item["path"]):
            print(
                f"| {row['id']} | {parse_score(row)} | {parse_ux_score(row)} | "
                f"{row['section']} | `{row['path']}` |"
            )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
