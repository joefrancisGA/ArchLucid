#!/usr/bin/env python3
"""Restore Evidence scores into the owner UI route traffic workbook from git history."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "scripts" / "ci"))

from archlucid_ui_route_catalog import migrate_workbook_path
from archlucid_ui_route_traffic_table import (
    DOC,
    EVIDENCE_INDEX,
    ensure_owner_workbook,
    parse_rows,
    parse_score,
    set_score_dimension,
    sort_rows,
    split_document,
    write_table,
)


def canonical_workbook_path(path: str) -> str:
    return migrate_workbook_path(path)


def load_source_text(ref: str) -> str | None:
    result = subprocess.run(
        ["git", "show", f"{ref}:docs/architecture/ui_route_traffic_estimates.md"],
        capture_output=True,
        text=True,
        cwd=REPO_ROOT,
    )

    if result.returncode != 0:
        return None

    return result.stdout


def find_latest_checked_in_source_ref() -> str | None:
    result = subprocess.run(
        [
            "git",
            "log",
            "--all",
            "--format=%H",
            "--",
            "docs/architecture/ui_route_traffic_estimates.md",
        ],
        capture_output=True,
        text=True,
        cwd=REPO_ROOT,
        check=True,
    )
    for commit_hash in result.stdout.splitlines():
        if not commit_hash.strip():
            continue
        text = load_source_text(commit_hash)
        if text is None:
            continue
        match = re.search(r"\*\*OVERALL WEIGHT SCORE:\*\* ([0-9.]+)%?", text)
        if match is None:
            continue
        if float(match.group(1)) > 0:
            return commit_hash
    return None


def score_map_from_text(text: str) -> dict[str, int]:
    rows = parse_rows(text)
    by_path: dict[str, int] = {}

    for row in rows:
        score = parse_score(row)
        if score <= 0:
            continue
        canonical = canonical_workbook_path(row["path"])
        existing = by_path.get(canonical, 0)
        if score > existing:
            by_path[canonical] = score

    return by_path


def pick_best_source(refs: list[str]) -> tuple[str, dict[str, int]]:
    best_ref = ""
    best_map: dict[str, int] = {}

    for ref in refs:
        text = load_source_text(ref)
        if text is None:
            continue
        score_map = score_map_from_text(text)
        if len(score_map) > len(best_map):
            best_ref = ref
            best_map = score_map

    if not best_ref:
        raise RuntimeError("No git source contained a scored ui_route_traffic_estimates.md")

    return best_ref, best_map


def restore_scores(doc: Path, source_refs: list[str], *, dry_run: bool = False) -> tuple[str, int, int]:
    source_ref, score_map = pick_best_source(source_refs)
    text = doc.read_text(encoding="utf-8")
    before, table_body, after = split_document(text, doc)
    rows = parse_rows(table_body)
    applied = 0

    for row in rows:
        canonical = canonical_workbook_path(row["path"])
        restored_score = score_map.get(canonical)
        if restored_score is None:
            continue
        if parse_score(row) >= restored_score:
            continue
        set_score_dimension(row, EVIDENCE_INDEX, restored_score)
        applied += 1

    sorted_rows = sort_rows(rows)

    if not dry_run:
        write_table(doc, before, sorted_rows, after)

    return source_ref, applied, len(score_map)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--doc",
        type=Path,
        default=DOC,
        help="Owner workbook path (default: .local/owner/ui_route_traffic_estimates.md)",
    )
    parser.add_argument(
        "--source-ref",
        action="append",
        dest="source_refs",
        help="Explicit git ref to restore from (repeatable). "
        "Default: most recent checked-in commit with nonzero OVERALL WEIGHT SCORE",
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    doc = ensure_owner_workbook() if args.doc == DOC else args.doc.resolve()
    if not doc.is_file():
        print(f"restore-ui-route-traffic-scores-from-git: missing {doc}", file=sys.stderr)
        return 1

    source_refs = args.source_refs
    if not source_refs:
        latest_checked_in = find_latest_checked_in_source_ref()
        if latest_checked_in is None:
            print(
                "restore-ui-route-traffic-scores-from-git: no checked-in source with nonzero OVERALL WEIGHT SCORE",
                file=sys.stderr,
            )
            return 1
        source_refs = [latest_checked_in]

    source_ref, applied, source_count = restore_scores(doc, source_refs, dry_run=args.dry_run)
    mode = "Would restore" if args.dry_run else "Restored"
    print(f"{mode} scores in {doc}")
    print(f"  source: {source_ref} ({source_count} scored canonical path(s))")
    print(f"  rows updated: {applied}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
