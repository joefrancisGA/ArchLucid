#!/usr/bin/env python3
"""Drift guard — score lift round 64 (batch 29 — export recovery and compare pickers)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/components/exports/ExportPartialCaptureRecoveryHonesty.tsx",
    "archlucid-ui/src/lib/exports/export-partial-capture-recovery-honesty-copy.ts",
    "archlucid-ui/src/lib/score-lift-round64-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round64-mounted-contract.test.ts",
    "archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/CompareRunPickersPartialInventoryFootnote.tsx",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 64 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 64 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())