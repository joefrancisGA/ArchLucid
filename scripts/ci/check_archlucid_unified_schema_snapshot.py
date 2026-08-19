#!/usr/bin/env python3
"""Fail when ArchLucid_Unified_Schema.sql drifts from generator output."""

from __future__ import annotations

import difflib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import build_archlucid_unified_schema_sql as generator

MAX_DIFF_LINES = 60


def main() -> int:
    if not generator.MASTER.is_file():
        print(f"Missing master DDL: {generator.MASTER}", file=sys.stderr)
        return 2

    if not generator.OUT.is_file():
        print(f"Missing snapshot: {generator.OUT}", file=sys.stderr)
        return 2

    expected = generator.render_unified_schema()
    actual = generator.OUT.read_text(encoding="utf-8")

    if actual == expected:
        print("ArchLucid_Unified_Schema.sql matches generator output.")
        return 0

    print(
        "ArchLucid_Unified_Schema.sql is stale. Regenerate with:\n"
        "  python scripts/ci/build_archlucid_unified_schema_sql.py",
        file=sys.stderr,
    )

    diff = difflib.unified_diff(
        actual.splitlines(),
        expected.splitlines(),
        fromfile="checked-in snapshot",
        tofile="generator output",
        lineterm="",
    )

    # The schema is ~8k lines, so a full diff would bury the failure in CI logs.
    for index, line in enumerate(diff):

        if index >= MAX_DIFF_LINES:
            print("  … diff truncated", file=sys.stderr)
            break

        print(line, file=sys.stderr)

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
