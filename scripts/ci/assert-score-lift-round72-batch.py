#!/usr/bin/env python3
"""Drift guard — score lift round 72 (batch 37 — working standards and load or filter honesty)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/governance/standards-rules-working-filter-partial-capture-copy.ts",
    "archlucid-ui/src/lib/remediation-factory/remediation-factory-priority-queue-load-failure-partial-capture-copy.ts",
    "archlucid-ui/src/lib/remediation-pattern/remediation-patterns-filter-empty-partial-capture-copy.ts",
    "archlucid-ui/src/lib/governance/signed-records-date-range-filter-empty-partial-capture-copy.ts",
    "archlucid-ui/src/lib/score-lift-round72-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round72-mounted-contract.test.ts",
    "archlucid-ui/src/app/(operator)/governance/standards-and-rules/_sections/StandardsRulesWorkingRulesSection.tsx",
    "archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryPriorityQueueLoadFailurePartialHonesty.tsx",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 72 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 72 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())