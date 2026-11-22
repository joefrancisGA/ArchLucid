#!/usr/bin/env python3
"""Drift guard — score lift round 84 (batch 49)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/architecture/compare-correlation-empty-and-second-seal-copy.ts",
    "archlucid-ui/src/lib/runs/run-detail-deliverables-blocked-export-finalize-and-partial-capture-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/resource-hub-findings-architecture-scope-and-severity-empty-copy.ts",
    "archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/CompareCorrelationEmptyAndSecondSealPartialHonesty.tsx",
    "archlucid-ui/src/components/runs/RunDetailDeliverablesBlockedExportFinalizeAndPartialHonesty.tsx",
    "archlucid-ui/src/components/infra-evidence/ResourceHubFindingsArchitectureScopeAndSeverityEmptyPartialHonesty.tsx",
    "archlucid-ui/src/lib/score-lift-round84-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round84-mounted-contract.test.ts",
    "archlucid-ui/src/lib/score-lift-round84-mounted-contract-depth.test.ts",
]

ROUND83 = "scripts/ci/assert-score-lift-round83-batch.py"


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 84 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)
        return 1

    prior = REPO_ROOT / ROUND83
    if prior.is_file():
        completed = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if completed.returncode != 0:
            return completed.returncode

    print("Score lift round 84 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
