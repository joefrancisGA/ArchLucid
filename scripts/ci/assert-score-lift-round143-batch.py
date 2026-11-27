#!/usr/bin/env python3
"""Drift guard — score lift round 143 (Wave B stickiness + accelerator richness)."""
from __future__ import annotations
import subprocess
import sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/product-line/securenow-resume-accelerator-open.ts",
    "archlucid-ui/src/lib/product-line/securenow-accelerator-catalog-filters.ts",
    "archlucid-ui/src/lib/product-line/securenow-accelerator-starter-packs.ts",
    "archlucid-ui/src/lib/product-line/securenow-accelerator-related-by-href.ts",
    "archlucid-ui/src/components/product-line/SecureNowAcceleratorResumeStrip.tsx",
    "archlucid-ui/src/components/product-line/SecureNowAcceleratorCatalogFilterChips.tsx",
    "archlucid-ui/src/lib/score-lift-round143-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round143-wave-b-mounted-contract.test.ts",
]
PRIOR = "scripts/ci/assert-score-lift-round141-batch.py"

def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 143 drift — missing files:", file=sys.stderr)
        for item in missing:
            print(f"  - {item}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / PRIOR
    if prior.is_file():
        completed = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if completed.returncode != 0:
            return completed.returncode
    print("Score lift round 143 batch modules present.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
