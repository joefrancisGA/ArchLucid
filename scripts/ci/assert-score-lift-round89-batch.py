#!/usr/bin/env python3
"""Drift guard — score lift round 89 (batch 54)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/architecture/compare-semantic-support-band-zero-counts-one-unsealed-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-treatment-band-zero-counts-one-unsealed-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-governance-diff-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-results-stale-inputs-not-load-failure-copy.ts",
    "archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/CompareSemanticSupportBandZeroCountsOneUnsealedPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/CompareTreatmentBandZeroCountsOneUnsealedPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/CompareGovernanceDiffEmptyPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/CompareResultsStaleInputsPartialHonesty.tsx",
    "archlucid-ui/src/lib/score-lift-round89-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round89-mounted-contract.test.ts",
    "archlucid-ui/src/lib/score-lift-round88-mounted-contract-depth.test.ts",
]

ROUND88 = "scripts/ci/assert-score-lift-round88-batch.py"


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 89 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)
        return 1

    prior = REPO_ROOT / ROUND88
    if prior.is_file():
        completed = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if completed.returncode != 0:
            return completed.returncode

    print("Score lift round 89 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
