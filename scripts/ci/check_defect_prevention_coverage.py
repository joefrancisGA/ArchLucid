#!/usr/bin/env python3
"""Validate the defect-prevention coverage matrix has honest status entries."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MATRIX = ROOT / "docs" / "engineering" / "DEFECT_PREVENTION_COVERAGE.md"
ALLOWED = {"Enforced", "Partial", "Gap"}
ROW = re.compile(r"^\|\s*([^|]+?)\s*\|\s*(Enforced|Partial|Gap)\s*\|\s*([^|]+?)\s*\|\s*(.*?)\s*\|$")


def validate(text: str) -> list[str]:
    errors: list[str] = []
    rows = [ROW.match(line) for line in text.splitlines()]
    rows = [row for row in rows if row]
    if len(rows) != 20:
        errors.append(f"expected 20 coverage rows, found {len(rows)}")

    seen: set[str] = set()
    for row in rows:
        assert row is not None
        item, status, evidence, remaining = row.groups()
        if item in seen:
            errors.append(f"duplicate coverage item: {item}")
        seen.add(item)
        if status not in ALLOWED:
            errors.append(f"invalid status for {item}: {status}")
        if not evidence or evidence.lower() in {"none", "tbd"}:
            errors.append(f"missing evidence for {item}")
        if status != "Enforced" and not remaining:
            errors.append(f"missing remaining work for {item}")

    return errors


def main() -> int:
    if not MATRIX.is_file():
        print(f"missing coverage matrix: {MATRIX}", file=sys.stderr)
        return 1
    errors = validate(MATRIX.read_text(encoding="utf-8"))
    if errors:
        print("check_defect_prevention_coverage: FAILED", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1
    print("check_defect_prevention_coverage: OK (20 honest coverage rows)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
