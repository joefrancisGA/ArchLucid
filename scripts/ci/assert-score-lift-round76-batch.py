#!/usr/bin/env python3
"""Drift guard — score lift round 76 (batch 41 — findings chips, combined filters, approval RP, terraform, ROI)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/governance/governance-findings-nl-facet-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/remediation-workbench-combined-filter-empty-partial-capture-copy.ts",
    "archlucid-ui/src/lib/governance/governance-approval-list-load-failure-partial-capture-copy.ts",
    "archlucid-ui/src/app/(operator)/governance/findings/_sections/GovernanceFindingsNlFacetFilterNoMatchPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchCombinedFilterEmptyPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/governance/_sections/GovernanceWorkflowApprovalsListLoadFailureHonesty.tsx",
    "archlucid-ui/src/lib/score-lift-round76-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round76-mounted-contract.test.ts",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 76 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 76 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())