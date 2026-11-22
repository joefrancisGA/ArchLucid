#!/usr/bin/env python3
"""Drift guard — score lift round 80 (batch 45)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/operator/operator-home-open-gate-collection-blocker-copy.ts",
    "archlucid-ui/src/lib/governance/governance-findings-job-view-and-nl-facet-combined-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/reviews/reviews-hub-list-context-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/insights/workspace-health-page-refresh-discipline-copy.ts",
    "archlucid-ui/src/lib/policy/policy-pack-hub-workspace-assignments-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/components/operator-home/OperatorHomeSecureNowCollectionBlockerStrip.tsx",
    "archlucid-ui/src/app/(operator)/governance/findings/_sections/GovernanceFindingsJobViewAndNlFacetFilterNoMatchPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/architecture/reviews/RunsListListContextFilterEmptyPartialHonesty.tsx",
    "archlucid-ui/src/lib/score-lift-round80-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round80-mounted-contract.test.ts",
    "archlucid-ui/src/lib/score-lift-round80-mounted-contract-depth.test.ts",
]

ROUND79 = "scripts/ci/assert-score-lift-round79-batch.py"


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 80 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)
        return 1

    prior = REPO_ROOT / ROUND79
    if prior.is_file():
        completed = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if completed.returncode != 0:
            return completed.returncode

    print("Score lift round 80 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
