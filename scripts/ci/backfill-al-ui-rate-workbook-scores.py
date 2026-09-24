#!/usr/bin/env python3
"""Backfill owner workbook Evidence/UX scores from shipped /al-ui-rate sessions.

Only updates rows that are still unscored (Evidence 0 and UX 0), unless --force.
Does not overwrite non-zero scores unless --force.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from archlucid_ui_route_traffic_table import (
    DOC,
    EVIDENCE_INDEX,
    UX_INDEX,
    ensure_owner_workbook,
    find_row,
    format_score_cell,
    parse_rows,
    parse_score,
    parse_score_series,
    parse_ux_score,
    set_score_dimension,
    sort_rows,
    split_document,
    weight,
    deficit,
    write_table,
)

# Canonical scores from shipped /al-ui-rate work (Evidence, UX).
# Later commits override earlier batches where noted in session history.
BACKFILL_SCORES: dict[str, tuple[int, int]] = {
    # ArchLucid marketing / admin / help (8c4ebdc1ce)
    "AC": (64, 70),
    "ACS": (70, 74),
    "IN": (72, 76),
    "INW": (70, 75),
    "ADB": (70, 74),
    "ABR": (68, 72),
    "INO": (66, 72),
    "IPR": (65, 71),
    "EAX": (76, 78),
    "HXX": (76, 78),
    "EXX": (76, 78),
    "HCA": (76, 78),
    "HE2": (76, 78),
    # Governance hub (8c4ebdc1ce)
    "GOU": (70, 74),
    "GOD": (75, 80),
    "GOE": (68, 72),
    "GOI": (70, 74),
    "GOS": (70, 74),
    "GDE": (74, 78),
    "GDI": (74, 78),
    "OIN": (74, 78),
    "GOR": (74, 78),
    "GOX": (74, 78),
    "GRE": (72, 76),
    "NRE": (74, 78),
    "GTE": (74, 78),
    "GNE": (68, 72),
    "ORE": (68, 72),
    "ORX": (68, 72),
    "COO": (62, 66),
    "GOO": (62, 66),
    "COD": (62, 66),
    "GOL": (63, 67),
    "ICL": (63, 67),
    "ING": (60, 65),
    "IPL": (60, 65),
    # Nested architecture tools (cbcf731c9a)
    "AAS": (72, 78),
    "ARO": (72, 78),
    "RAR": (72, 78),
    "ARI": (73, 78),
    "AGR": (72, 78),
    "ARM": (72, 77),
    "RER": (74, 79),
    "RAX": (72, 78),
    "ASE": (72, 78),
    # SecureNow compliance / security floor (b2e85ef1df overrides a79f76a5f4)
    "COS": (68, 72),
    "COF": (67, 71),
    "ERX": (68, 72),
    "SRE": (78, 74),
    "REX": (76, 81),
    # SecureNow infrastructure (a79f76a5f4)
    "IDR": (72, 68),
    "NDI": (70, 66),
    "IDI": (71, 67),
    "IRE": (73, 69),
    "IND": (74, 70),
    "INX": (68, 65),
    # SecureNow help (a79f76a5f4; HEK restored on master)
    "HFI": (65, 70),
    "HEG": (68, 74),
    "HPO": (66, 72),
    "EPX": (70, 73),
    "SEX": (69, 71),
    "HEK": (76, 78),
    "HST": (66, 72),
    "HSY": (64, 69),
    "HEH": (65, 71),
    # Evidence-only backfill
    "HEE": (78, 87),
    "GON": (80, 87),
}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Backfill /al-ui-rate workbook scores.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing non-zero scores when a backfill entry exists.",
    )
    parser.add_argument(
        "--doc",
        type=Path,
        default=DOC,
        help="Path to ui_route_traffic_estimates.md",
    )
    return parser


def should_update(row: dict[str, str], force: bool) -> bool:
    if force:
        return True

    evidence = parse_score(row)
    ux = parse_ux_score(row)

    if evidence == 0 and ux == 0:
        return True

    # Partial backfill when UX was written but Evidence was not.
    return evidence == 0 and ux > 0


def main() -> int:
    args = build_parser().parse_args()
    doc_path = ensure_owner_workbook() if args.doc == DOC else args.doc
    before, table_body, after = split_document(doc_path.read_text(encoding="utf-8"), doc_path)
    rows = parse_rows(table_body)

    if not rows:
        print("No table rows found.", file=sys.stderr)
        return 1

    updated: list[str] = []
    skipped: list[str] = []
    unknown: list[str] = []

    for row_id, (evidence, ux) in sorted(BACKFILL_SCORES.items()):
        match = find_row(rows, row_id)

        if match is None:
            unknown.append(row_id)
            continue

        if not should_update(match, args.force):
            skipped.append(row_id)
            continue

        prior_evidence = parse_score(match)
        prior_ux = parse_ux_score(match)
        legacy_single_score = len(parse_score_series(match)) == 1

        if args.force or (prior_evidence == 0 and prior_ux == 0) or legacy_single_score:
            match["score"] = format_score_cell([evidence, ux])
        else:
            set_score_dimension(match, EVIDENCE_INDEX, evidence)

        updated.append(row_id)

    rows = sort_rows(rows)
    write_table(doc_path, before, rows, after)

    print(f"Backfilled {len(updated)} row(s) in {doc_path}")
    if unknown:
        print(f"Unknown ID(s) (skipped): {', '.join(unknown)}")
    if skipped:
        print(f"Already scored (skipped): {', '.join(skipped)}")

    for row_id in updated:
        row = find_row(rows, row_id)
        if row is None:
            continue

        print(
            f"Updated {row_id} ({row['path']}): scores -> {row['score']}; "
            f"weight={weight(row):g}; deficit={deficit(row):g}"
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
