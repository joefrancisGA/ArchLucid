#!/usr/bin/env python3
"""Drift guard — score lift round 87 (batch 52)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/architecture/compare-run-pickers-first-selected-second-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-quality-delta-zero-counts-one-unsealed-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/digests/digests-browse-subscription-list-only-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/governance/governance-findings-architecture-scope-only-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/CompareRunPickersFirstSelectedSecondEmptyPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/CompareQualityDeltaZeroCountsOneUnsealedPartialHonesty.tsx",
    "archlucid-ui/src/components/digests/DigestsBrowseSubscriptionListOnlyEmptyPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/governance/findings/_sections/GovernanceFindingsArchitectureScopeOnlyFilterNoMatchPartialHonesty.tsx",
    "archlucid-ui/src/lib/score-lift-round87-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round87-mounted-contract.test.ts",
    "archlucid-ui/src/lib/score-lift-round87-mounted-contract-depth.test.ts",
]

ROUND86 = "scripts/ci/assert-score-lift-round86-batch.py"


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 87 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)
        return 1

    prior = REPO_ROOT / ROUND86
    if prior.is_file():
        completed = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if completed.returncode != 0:
            return completed.returncode

    print("Score lift round 87 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
