#!/usr/bin/env python3
"""Drift guard — score lift round 145 (Wave D SecureNow stickiness + template richness)."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/product-line/securenow-pinned-accelerator-paths.ts",
    "archlucid-ui/src/components/product-line/SecureNowAcceleratorPinnedPathsStrip.tsx",
    "archlucid-ui/src/lib/help/securenow-specialty-template-grid-footer-copy.ts",
    "archlucid-ui/src/components/help/HelpSpecialtyWalkthroughTemplateGridFooter.tsx",
    "archlucid-ui/src/lib/score-lift-round145-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round145-wave-d-mounted-contract.test.ts",
]
PRIOR = "scripts/ci/assert-score-lift-round144-batch.py"


def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 145 drift — missing files:", file=sys.stderr)
        for item in missing:
            print(f"  - {item}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / PRIOR
    if prior.is_file():
        completed = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if completed.returncode != 0:
            return completed.returncode
    print("Score lift round 145 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
