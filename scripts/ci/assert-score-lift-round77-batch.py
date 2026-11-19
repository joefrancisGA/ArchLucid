#!/usr/bin/env python3
"""Drift guard — score lift round 77 (batch 42 — filters, export, catalog RP, category, attack path, job view)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/infra-evidence/remediation-workbench-active-filters-summary-copy.ts",
    "archlucid-ui/src/lib/integrations/connection-status-category-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/policy/policy-packs-catalog-load-failure-partial-capture-copy.ts",
    "archlucid-ui/src/lib/remediation-factory/remediation-factory-attack-path-unevaluated-only-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/governance/governance-findings-job-view-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchActiveFiltersSummaryLine.tsx",
    "archlucid-ui/src/components/integrations/ConnectionStatusCategoryFilterEmptyPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/governance/policy-packs/_sections/PolicyPacksCatalogLoadFailurePartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/governance/findings/_sections/GovernanceFindingsJobViewFilterNoMatchPartialHonesty.tsx",
    "archlucid-ui/src/lib/score-lift-round77-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round77-mounted-contract.test.ts",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 77 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 77 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())