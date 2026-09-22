#!/usr/bin/env python3
"""Fail CI when insight-density distribution regresses to No evidence / No anchor cells."""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DISTRIBUTION_PATH = REPO_ROOT / "docs" / "quality" / "insight-density-engine-distribution.md"

TABLE_HEADER = (
    "| Engine | Findings | Min | Median | Max | Would demote if unprotected | "
    "Generic advice | No evidence | No anchor | Duplication | Would demote at 65 |"
)
NO_EVIDENCE_COLUMN = 7
NO_ANCHOR_COLUMN = 8


def _parse_distribution_rows(markdown: str) -> list[list[str]]:
    rows: list[list[str]] = []

    for line in markdown.splitlines():
        stripped = line.strip()

        if not stripped.startswith("|") or stripped.startswith("| ---"):
            continue

        cells = [cell.strip() for cell in stripped.strip("|").split("|")]

        if cells and cells[0].lower() == "engine":
            continue

        if len(cells) >= 9:
            rows.append(cells)

    return rows


def main() -> int:
    if not DISTRIBUTION_PATH.is_file():
        print(f"FAIL: missing distribution doc at {DISTRIBUTION_PATH}", file=sys.stderr)
        return 1

    markdown = DISTRIBUTION_PATH.read_text(encoding="utf-8")

    if TABLE_HEADER not in markdown:
        print("FAIL: insight-density distribution table header missing or changed", file=sys.stderr)
        return 1

    violations: list[str] = []

    for cells in _parse_distribution_rows(markdown):
        engine = cells[0]
        no_evidence = cells[NO_EVIDENCE_COLUMN]
        no_anchor = cells[NO_ANCHOR_COLUMN]

        if not re.fullmatch(r"\d+", no_evidence):
            violations.append(f"{engine}: invalid No evidence cell {no_evidence!r}")
            continue

        if not re.fullmatch(r"\d+", no_anchor):
            violations.append(f"{engine}: invalid No anchor cell {no_anchor!r}")
            continue

        if int(no_evidence) > 0:
            violations.append(f"{engine}: No evidence={no_evidence}")

        if int(no_anchor) > 0:
            violations.append(f"{engine}: No anchor={no_anchor}")

    if violations:
        print("FAIL: insight-density distribution regression:", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 1

    print("OK: insight-density distribution has 0 No evidence and 0 No anchor across all engines.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
