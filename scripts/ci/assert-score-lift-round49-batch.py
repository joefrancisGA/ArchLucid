#!/usr/bin/env python3
"""Drift guard — score lift round 49 (batch 14)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/infra-evidence/remediation-workbench-workflow-honesty-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/infrastructure-ask-insufficient-evidence-honesty-copy.ts",
    "archlucid-ui/src/lib/score-lift-round49-batch-honesty.test.ts",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 49 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 49 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())