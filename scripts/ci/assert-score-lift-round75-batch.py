#!/usr/bin/env python3
"""Drift guard — score lift round 75 (batch 40 — ranked chips, approval filter, wave filter, ROI labels)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/governance/governance-approval-status-filter.ts",
    "archlucid-ui/src/lib/governance/governance-approval-status-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/remediation-workbench-wave-filter-empty-partial-capture-copy.ts",
    "archlucid-ui/src/components/product-line/SecureNowInvestigationEffortMissingFieldLabelsLine.tsx",
    "archlucid-ui/src/lib/score-lift-round75-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round75-mounted-contract.test.ts",
    "archlucid-ui/src/app/(operator)/governance/_sections/GovernanceWorkflowApprovalsStatusFilterEmptyPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchWaveFilterEmptyPartialHonesty.tsx",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 75 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 75 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())