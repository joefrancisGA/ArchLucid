#!/usr/bin/env python3
"""Drift guard — score lift round 63 (batch 28 — compare, browse, attack path, ask page)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/architecture/architecture-compare-partial-inventory-footnote-copy.ts",
    "archlucid-ui/src/lib/digests-browse-scoped-filter-empty-copy.ts",
    "archlucid-ui/src/lib/score-lift-round63-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round63-mounted-contract.test.ts",
    "archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelPartialInventoryFootnote.tsx",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 63 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 63 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())