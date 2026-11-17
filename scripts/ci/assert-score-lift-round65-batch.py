#!/usr/bin/env python3
"""Drift guard — score lift round 65 (batch 30 — ask drawer, explorer, policy, attack path, sponsor drift, diagrams, terraform)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/infra-evidence/resource-explorer-empty-partial-capture-copy.ts",
    "archlucid-ui/src/lib/remediation-factory/remediation-factory-attack-path-unevaluated-only-partial-copy.ts",
    "archlucid-ui/src/lib/sponsor/sponsor-compliance-drift-partial-window-copy.ts",
    "archlucid-ui/src/lib/policy/policy-pack-detail-partial-assignment-copy.ts",
    "archlucid-ui/src/lib/score-lift-round65-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round65-mounted-contract.test.ts",
    "archlucid-ui/src/app/(operator)/governance/policy-packs/[id]/PolicyPackDetailPartialCaptureStrip.tsx",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 65 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 65 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())