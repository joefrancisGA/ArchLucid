#!/usr/bin/env python3
"""Drift guard — score lift round 54 (batch 19)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/infra-evidence/terraform-advisory-plan-output-not-apply-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/drift-empty-diffs-unchanged-filter-off-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/diagram-reconcile-filter-hid-rows-copy.ts",
    "archlucid-ui/src/lib/governance/standards-rules-catalog-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/governance/decision-register-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/product-line/partial-capture-snapshot-id-honesty-copy.ts",
    "archlucid-ui/src/lib/architecture/first-review-guide-sample-spine-prerequisites-copy.ts",
    "archlucid-ui/src/lib/score-lift-round54-batch-honesty.test.ts",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 54 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 54 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())