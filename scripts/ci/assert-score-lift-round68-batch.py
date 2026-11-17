#!/usr/bin/env python3
"""Drift guard — score lift round 68 (batch 33 — inbox, queue, hub config, digests)."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

REQUIRED_PATHS = [
    "archlucid-ui/src/lib/governance/governance-approval-queue-empty-partial-capture-copy.ts",
    "archlucid-ui/src/lib/operator/needs-attention-inbox-all-clear-partial-capture-copy.ts",
    "archlucid-ui/src/lib/score-lift-round68-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round68-mounted-contract.test.ts",
    "archlucid-ui/src/app/(operator)/governance/_sections/GovernanceWorkflowApprovalsEmptyPartialHonesty.tsx",
    "archlucid-ui/src/components/digests/DigestsBrowseSetupEmptyPartialHonesty.tsx",
]


def main() -> int:
    missing = [relative for relative in REQUIRED_PATHS if not (REPO_ROOT / relative).is_file()]

    if missing:
        print("Score lift round 68 drift — missing files:", file=sys.stderr)
        for path in missing:
            print(f"  - {path}", file=sys.stderr)

        return 1

    print("Score lift round 68 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())