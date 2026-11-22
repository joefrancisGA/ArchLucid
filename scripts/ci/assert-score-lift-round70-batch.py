#!/usr/bin/env python3
"""Drift guard — score lift round 70 (batch 35 — filter empties and policy packs)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/governance/governance-findings-filter-no-match-partial-capture-copy.ts",
    "archlucid-ui/src/lib/policy/policy-packs-registered-list-empty-partial-capture-copy.ts",
    "archlucid-ui/src/lib/score-lift-round70-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round70-mounted-contract.test.ts",
    "archlucid-ui/src/app/(operator)/governance/findings/_sections/GovernanceFindingsFilterNoMatchPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/insights/evidence-graph/_sections/GraphLoadedZeroNodesPartialCaptureHonesty.tsx",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 70 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 70 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())