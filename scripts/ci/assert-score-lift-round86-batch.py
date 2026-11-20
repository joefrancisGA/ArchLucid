#!/usr/bin/env python3
"""Drift guard — score lift round 86 (batch 51)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/infra-evidence/resource-explorer-category-and-name-prefix-combined-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/insights/evidence-graph-type-filter-and-node-focus-combined-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/integrations/connection-status-category-and-subscription-scope-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/governance/governance-findings-queue-header-partial-capture-copy.ts",
    "archlucid-ui/src/components/infra-evidence/ResourcesExplorerCategoryAndNamePrefixCombinedFilterEmptyPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/insights/evidence-graph/_sections/GraphTypeFilterAndNodeFocusCombinedEmptyPartialHonesty.tsx",
    "archlucid-ui/src/components/integrations/ConnectionStatusCategoryAndSubscriptionScopeFilterEmptyPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/governance/findings/_sections/GovernanceFindingsQueueHeaderPartialCaptureHonesty.tsx",
    "archlucid-ui/src/lib/score-lift-round86-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round86-mounted-contract.test.ts",
    "archlucid-ui/src/lib/score-lift-round86-mounted-contract-depth.test.ts",
]

ROUND85 = "scripts/ci/assert-score-lift-round85-batch.py"


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 86 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)
        return 1

    prior = REPO_ROOT / ROUND85
    if prior.is_file():
        completed = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if completed.returncode != 0:
            return completed.returncode

    print("Score lift round 86 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
