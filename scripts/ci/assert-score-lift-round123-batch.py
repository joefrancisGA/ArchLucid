#!/usr/bin/env python3
"""Drift guard — score lift round 123 (batch 88)."""
from __future__ import annotations
import subprocess, sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/insights/evidence-graph-edge-focus-only-empty-partial-capture-copy.ts",
    "archlucid-ui/src/lib/insights/evidence-graph-type-filter-and-scope-combined-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/insights/evidence-graph-type-filter-and-path-only-combined-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/insights/evidence-graph-type-filter-and-edge-focus-combined-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/app/(operator)/insights/evidence-graph/_sections/GraphEdgeFocusOnlyEmptyPartialCaptureHonesty.tsx",
    "archlucid-ui/src/lib/score-lift-round123-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round123-mounted-contract.test.ts",
]
ROUND121 = "scripts/ci/assert-score-lift-round121-batch.py"
def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 123 drift — missing files:", file=sys.stderr)
        for p in missing: print(f"  - {p}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / ROUND121
    if prior.is_file():
        c = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if c.returncode != 0: return c.returncode
    print("Score lift round 123 batch modules present.")
    return 0
if __name__ == "__main__": raise SystemExit(main())
