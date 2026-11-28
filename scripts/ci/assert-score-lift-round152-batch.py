#!/usr/bin/env python3
"""Drift guard — score lift round 152 (Wave H3 SecureNow cutting-edge substrate)."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/product-line/securenow-cutting-edge-substrate-copy.ts",
    "archlucid-ui/src/lib/product-line/resolve-securenow-cutting-edge-substrate.ts",
    "archlucid-ui/src/components/product-line/SecureNowCuttingEdgeSubstrateStrip.tsx",
    "archlucid-ui/src/components/product-line/SecureNowCuttingEdgeSubstrateAuto.tsx",
    "archlucid-ui/src/lib/score-lift-round152-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round152-wave-h3-mounted-contract.test.ts",
]
PRIOR = "scripts/ci/assert-score-lift-round149-batch.py"


def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 152 drift — missing files:", file=sys.stderr)
        for item in missing:
            print(f"  - {item}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / PRIOR
    if prior.is_file():
        completed = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if completed.returncode != 0:
            return completed.returncode
    print("Score lift round 152 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
