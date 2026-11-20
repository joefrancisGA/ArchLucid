#!/usr/bin/env python3
"""Drift guard — score lift round 78 (batch 43)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/reviews/reviews-hub-search-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/governance/governance-findings-register-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/insights/graph-evidence-trail-load-failure-partial-capture-copy.ts",
    "archlucid-ui/src/lib/policy/policy-pack-detail-load-failure-partial-capture-copy.ts",
    "archlucid-ui/src/app/(operator)/architecture/reviews/RunsListSearchFilterEmptyPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/governance/findings/_sections/GovernanceFindingsRegisterFilterNoMatchPartialHonesty.tsx",
    "archlucid-ui/src/lib/score-lift-round78-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round78-mounted-contract.test.ts",
]

UMBRELLA = "scripts/ci/assert-score-lift-rounds-65-through-77-umbrella.py"


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 78 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)
        return 1

    umbrella = REPO_ROOT / UMBRELLA
    if umbrella.is_file():
        completed = subprocess.run([sys.executable, str(umbrella)], cwd=REPO_ROOT)
        if completed.returncode != 0:
            return completed.returncode

    print("Score lift round 78 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
