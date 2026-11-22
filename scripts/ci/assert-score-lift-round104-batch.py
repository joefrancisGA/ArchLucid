#!/usr/bin/env python3
"""Drift guard — score lift round 104 (batch 69)."""
from __future__ import annotations
import subprocess, sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/integrations/connection-status-dashboard-partial-capture-copy.ts",
    "archlucid-ui/src/components/integrations/ConnectionStatusDashboardPartialCaptureHonesty.tsx",
    "archlucid-ui/src/lib/findings/run-detail-findings-header-partial-capture-copy.ts",
    "archlucid-ui/src/components/findings/RunDetailFindingsHeaderPartialCaptureHonesty.tsx",
    "archlucid-ui/src/lib/insights/evidence-graph-type-filter-empty-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/remediation-factory/remediation-factory-attack-path-table-partial-capture-not-load-failure-copy.ts",
    "archlucid-ui/src/lib/score-lift-round104-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round104-mounted-contract.test.ts",
]
ROUND103 = "scripts/ci/assert-score-lift-round103-batch.py"
def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 104 drift — missing files:", file=sys.stderr)
        for p in missing: print(f"  - {p}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / ROUND103
    if prior.is_file():
        c = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if c.returncode != 0: return c.returncode
    print("Score lift round 104 batch modules present.")
    return 0
if __name__ == "__main__": raise SystemExit(main())
