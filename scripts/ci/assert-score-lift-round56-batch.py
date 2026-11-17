#!/usr/bin/env python3
"""Drift guard — score lift round 56 (batch 21)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/scorecard/pilot-scorecard-headline-band-roi-non-summing-copy.ts",
    "archlucid-ui/src/lib/product-line/securenow-second-capture-cloud-connections-return-path.ts",
    "archlucid-ui/src/lib/integrations/cloud-connections-return-path-honesty-copy.ts",
    "archlucid-ui/src/lib/score-lift-round56-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round56-mounted-contract.test.ts",
    "archlucid-ui/src/app/(operator)/governance/decision-register/_sections/DecisionRegisterLoadFailure.test.tsx",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 56 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 56 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())