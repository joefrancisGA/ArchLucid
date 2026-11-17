#!/usr/bin/env python3
"""Drift guard — score lift round 53 (batch 18)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/infra-evidence/drift-empty-diffs-not-failure-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/drift-empty-inventory-not-failure-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/diagram-reconcile-zero-changes-not-clean-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-delta-counts-two-sealed-footnote-copy.ts",
    "archlucid-ui/src/lib/governance/standards-rules-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/remediation-pattern/remediation-patterns-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/digests/digest-subscriptions-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/infrastructure-ask-insufficient-evidence-snapshot-copy.ts",
    "archlucid-ui/src/lib/score-lift-round53-batch-honesty.test.ts",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 53 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 53 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())