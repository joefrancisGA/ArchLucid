#!/usr/bin/env python3
"""Drift guard — score lift round 81 (batch 46)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/governance/governance-findings-register-and-job-view-combined-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/governance/governance-findings-register-and-job-view-and-nl-facet-combined-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/governance/governance-assigned-to-me-empty-collection-blocker-preface-copy.ts",
    "archlucid-ui/src/lib/reviews/reviews-hub-orphan-candidates-context-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/reviews/reviews-hub-list-context-and-search-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/app/(operator)/governance/findings/_sections/GovernanceFindingsRegisterAndJobViewFilterNoMatchPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/governance/findings/_sections/GovernanceFindingsRegisterAndJobViewAndNlFacetFilterNoMatchPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/architecture/reviews/RunsListOrphanCandidatesContextFilterEmptyPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/architecture/reviews/RunsListListContextAndSearchFilterEmptyPartialHonesty.tsx",
    "archlucid-ui/src/lib/score-lift-round81-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round81-mounted-contract.test.ts",
    "archlucid-ui/src/lib/score-lift-round81-mounted-contract-depth.test.ts",
]

ROUND80 = "scripts/ci/assert-score-lift-round80-batch.py"


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 81 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)
        return 1

    prior = REPO_ROOT / ROUND79
    if prior.is_file():
        completed = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if completed.returncode != 0:
            return completed.returncode

    print("Score lift round 81 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
