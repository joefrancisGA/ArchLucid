#!/usr/bin/env python3
"""Drift guard — score lift round 92 (batch 57)."""
from __future__ import annotations
import subprocess, sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/architecture/compare-trust-banner-current-effective-unsealed-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-live-region-stale-inputs-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-structured-diff-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-raw-manifest-diff-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/score-lift-round92-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round92-mounted-contract.test.ts",
]
ROUND91 = "scripts/ci/assert-score-lift-round91-batch.py"
def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 92 drift — missing files:", file=sys.stderr)
        for p in missing: print(f"  - {p}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / ROUND91
    if prior.is_file():
        c = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if c.returncode != 0: return c.returncode
    print("Score lift round 92 batch modules present.")
    return 0
if __name__ == "__main__": raise SystemExit(main())
