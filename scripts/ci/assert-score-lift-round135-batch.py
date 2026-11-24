#!/usr/bin/env python3
"""Drift guard — score lift round 135 (batch 100 — accelerator richness)."""
from __future__ import annotations
import subprocess, sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/help/specialty-template-authority-load-failure-copy.ts",
    "archlucid-ui/src/lib/help/specialty-template-preview-fixture-copy.ts",
    "archlucid-ui/src/lib/help/specialty-walkthroughs-partial-capture-copy.ts",
    "archlucid-ui/src/lib/operator/operator-authority-me-load-failure.ts",
    "archlucid-ui/src/lib/remediation-factory/remediation-factory-ranked-paths-empty-accelerator-handoff-copy.ts",
    "archlucid-ui/src/lib/golden-sponsor-package-walkthrough-partial-capture-copy.ts",
    "archlucid-ui/src/components/help/SpecialtyTemplateAuthorityLoadFailurePanel.tsx",
    "archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryRankedPathsEmptyAcceleratorHandoff.tsx",
    "archlucid-ui/src/components/golden-walkthrough/GoldenSponsorPackageWalkthroughPartialCaptureStrip.tsx",
    "archlucid-ui/src/lib/score-lift-round135-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round135-mounted-contract.test.ts",
]
PRIOR = "scripts/ci/assert-score-lift-round134-batch.py"
def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 135 drift — missing files:", file=sys.stderr)
        for p in missing: print(f"  - {p}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / PRIOR
    if prior.is_file():
        c = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if c.returncode != 0: return c.returncode
    print("Score lift round 135 batch modules present.")
    return 0
if __name__ == "__main__": raise SystemExit(main())
