#!/usr/bin/env python3
"""Fail if CodeQL SARIF under a directory lists any non-suppressed findings (excludes note/none)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def _finding_count(data: object) -> int:
    if not isinstance(data, dict):
        return 0

    runs = data.get("runs")
    if runs is None or not isinstance(runs, list):
        return 0

    total = 0

    for run in runs:
        if not isinstance(run, dict):
            continue

        results = run.get("results")
        if results is None or not isinstance(results, list):
            continue

        for result in results:
            if not isinstance(result, dict):
                continue

            suppressions = result.get("suppressions")
            if isinstance(suppressions, list) and len(suppressions) > 0:
                continue

            level_raw = result.get("level")
            level = level_raw if isinstance(level_raw, str) else "warning"

            # Treat missing level like tool-default (warning-ish); omit editorial note-level noise.
            if level in {"note", "none"}:
                continue

            total += 1

    return total


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        description="Exit with status 1 if SARIF directories contain unresolved CodeQL findings.",
    )
    parser.add_argument(
        "directories",
        nargs="+",
        type=Path,
        help="Directories to scan recursively for *.sarif files.",
    )
    parsed = parser.parse_args(argv)

    grand_total = 0
    any_file = False

    for raw in parsed.directories:
        root = raw.resolve()

        if not root.is_dir():
            print(f"::error::{root} is not a directory.")
            return 2

        for sarif in sorted(root.rglob("*.sarif")):
            any_file = True

            try:
                text = sarif.read_text(encoding="utf-8")
            except OSError as exc:
                print(f"::error::Could not read {sarif}: {exc}")
                return 2

            try:
                data = json.loads(text)
            except json.JSONDecodeError as exc:
                print(f"::error::Invalid SARIF JSON in {sarif}: {exc}")
                return 2

            count = _finding_count(data)
            grand_total += count

            if count != 0:
                try:
                    display = sarif.relative_to(Path.cwd())
                except ValueError:
                    display = sarif

                print(f"::warning::{display}: {count} finding(s).")

    if not any_file:
        print(f"::error::No SARIF files found under {[str(Path(p).resolve()) for p in parsed.directories]}")
        return 2

    if grand_total != 0:
        print(f"::error::CodeQL SARIF gate: {grand_total} unresolved finding(s) across listed directories.")

        return 1

    print("CodeQL SARIF gate: OK (zero unresolved findings in supplied SARIF directories).")

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
