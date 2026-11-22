#!/usr/bin/env python3
"""Drift guard — score lift round 102 (batch 67)."""
from __future__ import annotations
import subprocess, sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/findings/guided-review-findings-toolbar-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/findings/run-detail-findings-toolbar-filter-active.ts",
    "archlucid-ui/src/lib/reviews/review-presenter-mode-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/diagram-reconcile-stale-snapshot-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/operator/operator-home-open-gate-collection-blocker-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/score-lift-round102-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round102-mounted-contract.test.ts",
]
ROUND101 = "scripts/ci/assert-score-lift-round101-batch.py"
def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 102 drift — missing files:", file=sys.stderr)
        for p in missing: print(f"  - {p}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / ROUND101
    if prior.is_file():
        c = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if c.returncode != 0: return c.returncode
    print("Score lift round 102 batch modules present.")
    return 0
if __name__ == "__main__": raise SystemExit(main())
