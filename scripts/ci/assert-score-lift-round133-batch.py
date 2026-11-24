#!/usr/bin/env python3
"""Drift guard — score lift round 133 (batch 98)."""
from __future__ import annotations
import subprocess, sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/infra-evidence/drift-empty-diffs-not-failure-copy.ts",
    "archlucid-ui/src/lib/runs/package-changes-since-finalize-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/governance/decision-register-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/governance/governance-approval-status-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/score-lift-round133-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round133-mounted-contract.test.ts",
]
PRIOR = "scripts/ci/assert-score-lift-round131-batch.py"
PRIOR_ALT = "scripts/ci/assert-score-lift-round132-batch.py"
def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 133 drift — missing files:", file=sys.stderr)
        for p in missing: print(f"  - {p}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / PRIOR_ALT
    if not prior.is_file():
        prior = REPO_ROOT / PRIOR
    if prior.is_file():
        c = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if c.returncode != 0: return c.returncode
    print("Score lift round 133 batch modules present.")
    return 0
if __name__ == "__main__": raise SystemExit(main())
