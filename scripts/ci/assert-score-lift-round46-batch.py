#!/usr/bin/env python3
"""Drift guard — score lift round 46 (batch 11)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/integrations/connector-configured-status-honesty-copy.ts",
    "archlucid-ui/src/lib/architecture/first-review-tenant-review-seal-discipline-copy.ts",
    "archlucid-ui/src/lib/score-lift-round46-batch-honesty.test.ts",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 46 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 46 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())