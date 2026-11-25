#!/usr/bin/env python3
"""Drift guard — score lift round 137 (SecureNow RankedPath Ask handoff)."""
from __future__ import annotations
import subprocess, sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/infra-evidence/infrastructure-ask-ranked-path-honesty-copy.ts",
    "archlucid-ui/src/lib/remediation-factory/remediation-factory-ranked-path-ask-handoff-copy.ts",
    "archlucid-ui/src/components/remediation-factory/RemediationFactoryRankedPathAskHandoff.tsx",
    "archlucid-ui/src/lib/score-lift-round137-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round137-ranked-path-ask-mounted-contract.test.ts",
]
PRIOR = "scripts/ci/assert-score-lift-round136-batch.py"
def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 137 drift — missing files:", file=sys.stderr)
        for p in missing: print(f"  - {p}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / PRIOR
    if prior.is_file():
        c = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if c.returncode != 0: return c.returncode
    print("Score lift round 137 batch modules present.")
    return 0
if __name__ == "__main__": raise SystemExit(main())
