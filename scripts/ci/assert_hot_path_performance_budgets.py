#!/usr/bin/env python3
"""Validate hot-path performance budget registry (assessment #18)."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


REQUIRED_TABLE_COLUMNS: tuple[str, ...] = (
    "Path",
    "p95 budget",
    "Fixture / check",
    "Metric / dashboard",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def validate_doc(path: Path) -> list[str]:
    errors: list[str] = []

    if not path.is_file():
        return [f"missing budget doc: {path.as_posix()}"]

    text = path.read_text(encoding="utf-8", errors="replace")

    if "| Path |" not in text:
        errors.append("budget doc missing markdown table header")

    for column in REQUIRED_TABLE_COLUMNS:
        if column not in text:
            errors.append(f"budget doc missing column: {column}")

    rows = [line.strip().split("|")[1:-1] for line in text.splitlines() if line.strip().startswith("|")]
    for name in ("Run detail", "Proof packet", "Retrieval grounding"):
        matches = [row for row in rows if row and name.casefold() in row[0].casefold()]
        if not matches:
            errors.append(f"budget doc missing {name} row")
        elif not any(len(row) >= 2 and re.fullmatch(r"\d+", row[1].strip()) for row in matches):
            errors.append(f"budget doc missing numeric p95 budget for {name}")

    if not re.search(r"p95 budget \(ms\)", text, re.IGNORECASE):
        errors.append("budget doc must document p95 budget column in milliseconds")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--doc",
        type=Path,
        default=repo_root() / "docs" / "runbooks" / "HOT_PATH_PERFORMANCE_BUDGETS.md",
    )
    args = parser.parse_args()

    errors = validate_doc(args.doc)

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)

        return 1

    print(f"OK: hot-path performance budget registry valid ({args.doc.as_posix()})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
