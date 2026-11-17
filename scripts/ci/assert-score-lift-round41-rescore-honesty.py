#!/usr/bin/env python3
"""Drift guard — score lift round 41 rescore honesty modules."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/product-line/securenow-findings-queue-open-gate-scope.ts",
    "archlucid-ui/src/lib/product-line/securenow-fixture-path-id.ts",
    "archlucid-ui/src/lib/product-line/securenow-diagram-filter-empty-copy.ts",
    "archlucid-ui/src/lib/remediation-factory-simulator-rank-honesty-copy.ts",
    "archlucid-ui/src/lib/first-review-guide-after-prerequisites-copy.ts",
    "archlucid-ui/src/lib/score-lift-round41-rescore-honesty.test.ts",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 41 honesty drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 41 honesty modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())