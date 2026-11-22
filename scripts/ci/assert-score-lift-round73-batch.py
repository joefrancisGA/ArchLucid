#!/usr/bin/env python3
"""Drift guard — score lift round 73 (batch 38 — factory partial reads and patterns catalog)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/remediation-factory/remediation-factory-executive-metrics-load-failure-partial-capture-copy.ts",
    "archlucid-ui/src/lib/remediation-factory/remediation-factory-ranked-paths-load-failure-partial-capture-copy.ts",
    "archlucid-ui/src/lib/remediation-pattern/remediation-patterns-catalog-empty-partial-capture-copy.ts",
    "archlucid-ui/src/lib/score-lift-round73-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round73-mounted-contract.test.ts",
    "archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryExecutiveMetricsLoadFailurePartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/governance/remediation-patterns/RemediationPatternsCatalogEmptyPartialHonesty.tsx",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 73 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 73 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())