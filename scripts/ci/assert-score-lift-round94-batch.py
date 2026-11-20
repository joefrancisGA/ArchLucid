#!/usr/bin/env python3
"""Drift guard — score lift round 94 (batch 59)."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/architecture/compare-export-docx-blocked-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-drift-download-blocked-not-empty-compare-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-insufficient-finalized-zero-finalized-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-manifest-export-blocked-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/score-lift-round94-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round94-mounted-contract.test.ts",
]
ROUND93 = "scripts/ci/assert-score-lift-round93-batch.py"


def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 94 drift — missing files:", file=sys.stderr)
        for p in missing:
            print(f"  - {p}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / ROUND93
    if prior.is_file():
        c = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if c.returncode != 0:
            return c.returncode
    print("Score lift round 94 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
