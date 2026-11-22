#!/usr/bin/env python3
"""Drift guard — score lift round 105 (batch 70)."""
from __future__ import annotations
import subprocess, sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/policy/policy-packs-enforced-rules-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/administration/system-health-summary-tiles-point-in-time-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/runs/run-detail-deliverables-primary-export-finalize-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/product-line/securenow-investigation-effort-blocking-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/score-lift-round105-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round105-mounted-contract.test.ts",
]
ROUND104 = "scripts/ci/assert-score-lift-round104-batch.py"
def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 105 drift — missing files:", file=sys.stderr)
        for p in missing: print(f"  - {p}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / ROUND104
    if prior.is_file():
        c = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if c.returncode != 0: return c.returncode
    print("Score lift round 105 batch modules present.")
    return 0
if __name__ == "__main__": raise SystemExit(main())
