#!/usr/bin/env python3
"""
Fail if a markdown file exceeds a maximum line count (CI guard for canonical posters).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--max-lines",
        type=int,
        default=500,
        help="Maximum allowed lines (inclusive of blank lines).",
    )
    parser.add_argument(
        "paths",
        nargs="+",
        type=Path,
        help="Markdown files to check.",
    )
    args = parser.parse_args()
    max_lines: int = args.max_lines
    failures: list[str] = []

    for path in args.paths:
        if not path.is_file():
            failures.append(f"{path}: not a file")
            continue

        text = path.read_text(encoding="utf-8", errors="replace")
        line_count = 0 if len(text) == 0 else text.count("\n") + 1

        if line_count > max_lines:
            failures.append(f"{path}: {line_count} lines exceeds budget {max_lines}")

    if failures:
        print("check_doc_size_budget: FAILED", file=sys.stderr)

        for line in failures:
            print(line, file=sys.stderr)

        return 1

    print(f"check_doc_size_budget: OK (max {max_lines} lines per file)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
