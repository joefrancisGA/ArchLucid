#!/usr/bin/env python3
"""Update ArchLucid UI route score dimensions by table ID and re-sort the master table."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from archlucid_ui_route_traffic_table import (
    DOC,
    SCORE_DIMENSIONS,
    deficit,
    ensure_owner_workbook,
    find_row,
    parse_rows,
    set_score_dimension,
    sort_rows,
    split_document,
    weight,
    write_table,
)

_DEFAULT_DIMENSION = "evidence"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Set a UI route score dimension by table ID.")
    parser.add_argument("id", nargs="?", help="Table ID shorthand (e.g. ASK, GFN)")
    parser.add_argument("score", nargs="?", type=int, help="Score 0-100 for the selected dimension")
    parser.add_argument(
        "--dimension",
        choices=sorted(SCORE_DIMENSIONS),
        default=_DEFAULT_DIMENSION,
        help=(
            "Scores position to write: 'evidence' (position 1, default) or "
            "'ux' (position 2, the dimension that drives Weight/Deficit/sort)"
        ),
    )
    parser.add_argument(
        "--batch",
        type=Path,
        help="Apply many rows at once from a file of 'ID score' lines ('#' comments ignored)",
    )
    parser.add_argument(
        "--doc",
        type=Path,
        default=DOC,
        help="Path to ui_route_traffic_estimates.md",
    )
    return parser


def resolve_doc(doc: Path) -> Path:
    return ensure_owner_workbook() if doc == DOC else doc


def parse_batch_file(path: Path) -> list[tuple[str, int]]:
    updates: list[tuple[str, int]] = []

    for number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        line = raw.split("#", 1)[0].strip()

        if not line:
            continue

        parts = line.split()

        if len(parts) != 2:
            raise ValueError(f"{path}:{number}: expected 'ID score', got '{raw.strip()}'")

        updates.append((parts[0].strip().upper(), int(parts[1])))

    return updates


def collect_updates(args: argparse.Namespace) -> list[tuple[str, int]]:
    if args.batch is not None:
        return parse_batch_file(args.batch)

    if args.id is None or args.score is None:
        raise ValueError("Provide both ID and score, or use --batch.")

    return [(args.id.strip().upper(), args.score)]


def validate_scores(updates: list[tuple[str, int]]) -> None:
    out_of_range = [row_id for row_id, score in updates if score < 0 or score > 100]

    if out_of_range:
        raise ValueError(f"Score must be between 0 and 100: {', '.join(out_of_range)}")


def format_row_report(row: dict[str, str], dimension: str, previous: str, rank: int, total: int) -> str:
    return (
        f"Updated {row['id']} ({row['path']}): {dimension} scores {previous} -> {row['score']}; "
        f"weight={weight(row):g}; deficit={deficit(row):g}; rank={rank}/{total}"
    )


def apply_updates(
    rows: list[dict[str, str]],
    updates: list[tuple[str, int]],
    dimension: str,
) -> tuple[list[str], list[str]]:
    previous_by_id: list[str] = []
    unknown: list[str] = []

    for row_id, score in updates:
        match = find_row(rows, row_id)

        if match is None:
            unknown.append(row_id)
            continue

        previous_by_id.append(f"{row_id}:{match['score']}")
        set_score_dimension(match, SCORE_DIMENSIONS[dimension], score)

    return previous_by_id, unknown


def main() -> int:
    args = build_parser().parse_args()

    try:
        updates = collect_updates(args)
        validate_scores(updates)
    except (ValueError, OSError) as error:
        print(str(error), file=sys.stderr)
        return 1

    doc_path = resolve_doc(args.doc)
    before, table_body, after = split_document(doc_path.read_text(encoding="utf-8"), doc_path)
    rows = parse_rows(table_body)

    if not rows:
        print("No table rows found.", file=sys.stderr)
        return 1

    previous_by_id, unknown = apply_updates(rows, updates, args.dimension)

    if unknown:
        known = ", ".join(sorted({row["id"] for row in rows})[:20])
        print(f"Unknown ID(s): {', '.join(unknown)}. Examples: {known}, ...", file=sys.stderr)
        return 1

    rows = sort_rows(rows)
    write_table(doc_path, before, rows, after)

    if len(updates) == 1:
        row_id, _score = updates[0]
        updated = find_row(rows, row_id)

        if updated is None:
            print("Updated row missing after resort.", file=sys.stderr)
            return 1

        previous = previous_by_id[0].split(":", 1)[1]
        print(format_row_report(updated, args.dimension, previous, rows.index(updated) + 1, len(rows)))
        return 0

    print(f"Updated {len(updates)} row(s) on dimension '{args.dimension}' in {doc_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
