#!/usr/bin/env python3
"""Drift guard — score lift round 55 (batch 20)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/governance/declared-connections-row-expiry-honesty-copy.ts",
    "archlucid-ui/src/lib/insights/workspace-health-kpi-card-as-of-copy.ts",
    "archlucid-ui/src/lib/product-line/securenow-investigation-effort-blocking-banner-copy.ts",
    "archlucid-ui/src/lib/guided-intake-scope-limits-agents-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/infra-evidence-ask-stale-snapshot-citation-copy.ts",
    "archlucid-ui/src/lib/score-lift-round55-batch-honesty.test.ts",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 55 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 55 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())