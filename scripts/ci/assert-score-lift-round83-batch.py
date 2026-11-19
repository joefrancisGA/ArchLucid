#!/usr/bin/env python3
"""Drift guard — score lift round 83 (batch 48)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/digests/digests-browse-scoped-and-subscription-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/exports/golden-manifest-export-disabled-and-finalize-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-quality-delta-partial-inventory-footnote-copy.ts",
    "archlucid-ui/src/components/digests/DigestsBrowseScopedAndSubscriptionFilterEmptyPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/CompareQualityDeltaPartialInventoryFootnote.tsx",
    "archlucid-ui/src/lib/score-lift-round83-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round83-mounted-contract.test.ts",
    "archlucid-ui/src/lib/score-lift-round83-mounted-contract-depth.test.ts",
]

ROUND82 = "scripts/ci/assert-score-lift-round82-batch.py"


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 83 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)
        return 1

    prior = REPO_ROOT / ROUND79
    if prior.is_file():
        completed = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if completed.returncode != 0:
            return completed.returncode

    print("Score lift round 83 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
