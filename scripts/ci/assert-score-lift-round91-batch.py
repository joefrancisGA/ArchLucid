#!/usr/bin/env python3
"""Drift guard — score lift round 91 (batch 56)."""
from __future__ import annotations
import subprocess, sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/architecture/compare-verdict-add-remove-two-sealed-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-execution-mode-one-unsealed-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-provenance-delta-partial-inventory-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/architecture/compare-agent-results-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/compare/compare-agent-results-empty.ts",
    "archlucid-ui/src/lib/score-lift-round91-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round91-mounted-contract.test.ts",
]
ROUND90 = "scripts/ci/assert-score-lift-round90-batch.py"
def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 91 drift — missing files:", file=sys.stderr)
        for p in missing: print(f"  - {p}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / ROUND90
    if prior.is_file():
        c = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if c.returncode != 0: return c.returncode
    print("Score lift round 91 batch modules present.")
    return 0
if __name__ == "__main__": raise SystemExit(main())
