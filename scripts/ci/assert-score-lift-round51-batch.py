#!/usr/bin/env python3
"""Drift guard — score lift round 51 (batch 16)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/extract-upload/extract-upload-accepted-evaluation-honesty-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/resource-hub-findings-empty-honesty-copy.ts",
    "archlucid-ui/src/lib/policy/policy-packs-catalog-empty-honesty-copy.ts",
    "archlucid-ui/src/lib/remediation-factory/remediation-factory-core-read-honesty-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/diagram-reconcile-pinned-snapshot-honesty-copy.ts",
    "archlucid-ui/src/lib/score-lift-round51-batch-honesty.test.ts",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 51 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 51 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())