#!/usr/bin/env python3
"""Drift guard — score lift round 100 (batch 65)."""
from __future__ import annotations
import subprocess, sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/exports/golden-manifest-lineage-verify-not-commit-before-seal-copy.ts",
    "archlucid-ui/src/lib/exports/golden-manifest-lineage-verify-http-failure-copy.ts",
    "archlucid-ui/src/lib/reviews/share-review-package-post-seal-api-failure-copy.ts",
    "archlucid-ui/src/lib/architecture/architecture-seal-delta-zero-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/architecture/architecture-seal-delta-load-failure-not-zero-copy.ts",
    "archlucid-ui/src/lib/architecture/architecture-seal-delta-single-seal-compare-blocked-copy.ts",
    "archlucid-ui/src/lib/compare/compare-finding-lifecycle-status-filter-empty-copy.ts",
    "archlucid-ui/src/lib/compare/compare-finding-lifecycle-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/score-lift-round100-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round100-mounted-contract.test.ts",
]
ROUND99 = "scripts/ci/assert-score-lift-round99-batch.py"
def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 100 drift — missing files:", file=sys.stderr)
        for p in missing: print(f"  - {p}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / ROUND99
    if prior.is_file():
        c = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if c.returncode != 0: return c.returncode
    print("Score lift round 100 batch modules present.")
    return 0
if __name__ == "__main__": raise SystemExit(main())
