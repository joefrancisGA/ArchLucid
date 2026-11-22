#!/usr/bin/env python3
"""Drift guard — score lift round 108 (batch 73)."""
from __future__ import annotations
import subprocess, sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/governance/governance-findings-empty-partial-capture-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/runs/run-detail-architecture-request-json-finalize-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/runs/run-detail-review-export-zip-finalize-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/insights/workspace-health-kpi-tiles-point-in-time-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/score-lift-round108-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round108-mounted-contract.test.ts",
]
ROUND107 = "scripts/ci/assert-score-lift-round107-batch.py"
def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 108 drift — missing files:", file=sys.stderr)
        for p in missing: print(f"  - {p}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / ROUND107
    if prior.is_file():
        c = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if c.returncode != 0: return c.returncode
    print("Score lift round 108 batch modules present.")
    return 0
if __name__ == "__main__": raise SystemExit(main())
