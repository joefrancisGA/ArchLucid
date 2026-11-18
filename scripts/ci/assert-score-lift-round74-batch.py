#!/usr/bin/env python3
"""Drift guard — score lift round 74 (batch 39 — status filter, attack path, simulator)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/infra-evidence/remediation-workbench-status-filter-empty-partial-capture-copy.ts",
    "archlucid-ui/src/lib/remediation-factory/remediation-factory-attack-path-report-load-failure-partial-capture-copy.ts",
    "archlucid-ui/src/lib/remediation-factory/remediation-factory-simulator-load-failure-partial-capture-copy.ts",
    "archlucid-ui/src/lib/score-lift-round74-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round74-mounted-contract.test.ts",
    "archlucid-ui/src/app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchStatusFilterEmptyPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactorySimulatorLoadFailurePartialHonesty.tsx",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 74 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 74 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())