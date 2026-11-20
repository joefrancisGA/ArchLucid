#!/usr/bin/env python3
"""Drift guard — score lift round 95 (batch 60)."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/architecture/compare-end-to-end-export-blocked-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-end-to-end-export-stale-inputs-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-pair-cite-strip-stale-current-effective-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-ai-narrative-missing-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/score-lift-round95-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round95-mounted-contract.test.ts",
]
ROUND94 = "scripts/ci/assert-score-lift-round94-batch.py"


def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 95 drift — missing files:", file=sys.stderr)
        for p in missing:
            print(f"  - {p}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / ROUND94
    if prior.is_file():
        c = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if c.returncode != 0:
            return c.returncode
    print("Score lift round 95 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
