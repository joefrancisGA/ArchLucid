#!/usr/bin/env python3
"""Drift guard — score lift round 136 (SecureNow stickiness second capture)."""
from __future__ import annotations
import subprocess, sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/product-line/resolve-securenow-successful-capture-count.ts",
    "archlucid-ui/src/hooks/use-securenow-needs-second-capture-path-delta.ts",
    "archlucid-ui/src/components/product-line/SecureNowSecondCapturePathDeltaHonestyStrip.tsx",
    "archlucid-ui/src/lib/governance/governance-findings-queue-second-capture-path-delta-copy.ts",
    "archlucid-ui/src/lib/infra-evidence/drift-workbench-second-capture-path-delta-copy.ts",
    "archlucid-ui/src/lib/score-lift-round136-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round136-stickiness-mounted-contract.test.ts",
]
PRIOR = "scripts/ci/assert-score-lift-round135-batch.py"
def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 136 drift — missing files:", file=sys.stderr)
        for p in missing: print(f"  - {p}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / PRIOR
    if prior.is_file():
        c = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if c.returncode != 0: return c.returncode
    print("Score lift round 136 batch modules present.")
    return 0
if __name__ == "__main__": raise SystemExit(main())
