#!/usr/bin/env python3
"""Drift guard — score lift round 71 (batch 36 — catalog and filter partial capture)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/policy/policy-packs-catalog-empty-partial-capture-copy.ts",
    "archlucid-ui/src/lib/governance/standards-rules-catalog-empty-partial-capture-copy.ts",
    "archlucid-ui/src/lib/score-lift-round71-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round71-mounted-contract.test.ts",
    "archlucid-ui/src/app/(operator)/governance/policy-packs/_sections/PolicyPacksCatalogEmptyPartialHonesty.tsx",
    "archlucid-ui/src/lib/compare-finding-correlation-counts-all-zero.ts",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 71 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 71 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())