#!/usr/bin/env python3
"""Drift guard — score lift round 42 (remaining round-41 items)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/product-line/securenow-citation-rejection-detail.ts",
    "archlucid-ui/src/lib/reviews/review-explanation-citation-rejection-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-second-sealed-review-honesty-copy.ts",
    "archlucid-ui/src/lib/score-lift-round42-remaining-honesty.test.ts",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 42 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 42 remaining modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())