#!/usr/bin/env python3
"""Drift guard — score lift round 58 (batch 23 — light desk follow-ups)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/product-line/securenow-second-capture-cloud-connections-return-path.ts",
    "archlucid-ui/src/lib/score-lift-round58-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round58-mounted-contract.test.ts",
    "archlucid-ui/src/app/(operator)/insights/architecture-scorecard/_sections/ScorecardMetricCard.operational-non-summing.test.tsx",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 58 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 58 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())