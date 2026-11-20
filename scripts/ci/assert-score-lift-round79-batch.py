#!/usr/bin/env python3
"""Drift guard — score lift round 79 (batch 44)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/reviews/reviews-hub-package-scope-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/reviews/reviews-hub-search-and-package-scope-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/exports/golden-manifest-export-disabled-while-blocked-copy.ts",
    "archlucid-ui/src/lib/governance/governance-findings-register-and-nl-facet-combined-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/app/(operator)/architecture/reviews/RunsListPackageScopeFilterEmptyPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/governance/findings/_sections/GovernanceFindingsRegisterAndNlFacetFilterNoMatchPartialHonesty.tsx",
    "archlucid-ui/src/lib/score-lift-round79-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round79-mounted-contract.test.ts",
    "archlucid-ui/src/lib/score-lift-round79-mounted-contract-depth.test.ts",
]

ROUND78 = "scripts/ci/assert-score-lift-round78-batch.py"


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 79 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)
        return 1

    prior = REPO_ROOT / ROUND78
    if prior.is_file():
        completed = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if completed.returncode != 0:
            return completed.returncode

    print("Score lift round 79 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
