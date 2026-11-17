#!/usr/bin/env python3
"""Drift guard — score lift round 69 (batch 34 — connectors, graph, hub audit)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/administration/connection-status-empty-partial-capture-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/resource-hub-audit-tab-partial-capture-copy.ts",
    "archlucid-ui/src/lib/score-lift-round69-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round69-mounted-contract.test.ts",
    "archlucid-ui/src/components/integrations/ConnectionStatusEmptyPartialHonesty.tsx",
    "archlucid-ui/src/app/(operator)/insights/evidence-graph/_sections/GraphIdlePartialCaptureHonesty.tsx",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 69 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 69 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())