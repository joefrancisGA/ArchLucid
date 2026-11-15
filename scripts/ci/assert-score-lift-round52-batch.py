#!/usr/bin/env python3
"""Drift guard — score lift round 52 (batch 17)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/governance/findings-header-partial-capture-honesty-copy.ts",
    "archlucid-ui/src/lib/insights/workspace-health-point-in-time-honesty-copy.ts",
    "archlucid-ui/src/lib/governance/governance-approval-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/governance/standards-cut-point-framework-theme-copy.ts",
    "archlucid-ui/src/lib/product-line/sponsor-path-disposition-save-error-honesty-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/diagram-empty-not-clean-result-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/drift-workbench-empty-not-failure-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/resource-explorer-empty-not-failure-copy.ts",
    "archlucid-ui/src/lib/architecture/first-review-guide-prerequisites-combined-copy.ts",
    "archlucid-ui/src/lib/product-line/path-inspect-long-path-id-honesty-copy.ts",
    "archlucid-ui/src/lib/score-lift-round52-batch-honesty.test.ts",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 52 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 52 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())