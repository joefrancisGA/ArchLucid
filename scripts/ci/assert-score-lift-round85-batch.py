#!/usr/bin/env python3
"""Drift guard — score lift round 85 (batch 50)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/architecture/compare-run-pickers-second-review-not-sealed-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-run-pickers-correlation-empty-and-seal-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/resource-hub-findings-operational-security-stream-empty-copy.ts",
    "archlucid-ui/src/lib/governance/governance-findings-architecture-scope-and-severity-combined-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/CompareRunPickersCorrelationEmptyAndSealPartialHonesty.tsx",
    "archlucid-ui/src/components/infra-evidence/ResourceHubFindingsOperationalSecurityStreamEmptyPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/governance/findings/_sections/GovernanceFindingsArchitectureScopeAndSeverityFilterNoMatchPartialHonesty.tsx",
    "archlucid-ui/src/lib/score-lift-round85-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round85-mounted-contract.test.ts",
    "archlucid-ui/src/lib/score-lift-round85-mounted-contract-depth.test.ts",
]

ROUND84 = "scripts/ci/assert-score-lift-round84-batch.py"


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 85 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)
        return 1

    prior = REPO_ROOT / ROUND84
    if prior.is_file():
        completed = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if completed.returncode != 0:
            return completed.returncode

    print("Score lift round 85 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
