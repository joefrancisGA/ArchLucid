#!/usr/bin/env python3
"""Drift guard — score lift round 119 (batch 84)."""
from __future__ import annotations
import subprocess, sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/infra-evidence/resource-hub-audit-partial-capture-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/resource-hub-terraform-not-mapped-partial-capture-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/resource-explorer-type-prefix-and-resource-group-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/compare/compare-finding-lifecycle-status-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/score-lift-round119-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round119-mounted-contract.test.ts",
]
ROUND118 = "scripts/ci/assert-score-lift-round118-batch.py"
def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 119 drift — missing files:", file=sys.stderr)
        for p in missing: print(f"  - {p}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / ROUND118
    if prior.is_file():
        c = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if c.returncode != 0: return c.returncode
    print("Score lift round 119 batch modules present.")
    return 0
if __name__ == "__main__": raise SystemExit(main())
