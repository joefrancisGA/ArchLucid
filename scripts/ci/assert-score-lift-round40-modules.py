#!/usr/bin/env python3
"""Drift guard — score lift round 40 UI modules must stay present on trunk."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/product-line/securenow-findings-queue-open-gate.ts",
    "archlucid-ui/src/lib/product-line/securenow-synthetic-fixture-discipline.ts",
    "archlucid-ui/src/lib/product-line/securenow-second-capture-delta-copy.ts",
    "archlucid-ui/src/lib/product-line/securenow-reader-scope-workbench-copy.ts",
    "archlucid-ui/src/lib/getting-started-help-guide-content.ts",
    "archlucid-ui/src/lib/score-lift-round40.product-line.test.ts",
    "archlucid-ui/src/components/governance/findings/SecureNowFindingsQueueOpenGateStrip.tsx",
    "archlucid-ui/src/accessibility/compliance-routes-axe.test.tsx",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 40 module drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 40 modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
