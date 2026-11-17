#!/usr/bin/env python3
"""Drift guard — score lift round 61 (batch 26 — satellite partial-capture honesty)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/components/product-line/SecureNowWorkspaceHealthPartialCaptureStrip.tsx",
    "archlucid-ui/src/lib/score-lift-round61-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round61-mounted-contract.test.ts",
    "archlucid-ui/src/lib/insights/securenow-workspace-health-partial-capture-copy.ts",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 61 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 61 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())