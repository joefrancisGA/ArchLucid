#!/usr/bin/env python3
"""Drift guard — score lift round 142 (Wave A lowest qualities batch)."""
from __future__ import annotations
import subprocess, sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/product-line/securenow-commercial-upgrade-cta-copy.ts",
    "archlucid-ui/src/lib/product-line/product-line-route-blocked-entitlement-copy.ts",
    "archlucid-ui/src/components/product-line/SecureNowProcurementTrustFooterDrawer.tsx",
    "archlucid-ui/src/components/product-line/SecureNowCommercialUpgradeCtaStrip.tsx",
    "archlucid-ui/src/lib/reviews/reviews-hub-decision-velocity-copy.ts",
    "archlucid-ui/src/components/reviews/ReviewsHubDecisionSlaBadge.tsx",
    "archlucid-ui/src/components/reviews/ReviewsHubWaitingOnChip.tsx",
    "archlucid-ui/src/components/reviews/ReviewWorkspaceDeferredNotificationsDrawer.tsx",
    "archlucid-ui/src/lib/score-lift-round142-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round142-wave-a-mounted-contract.test.ts",
    "scripts/ci/check_securenow_procurement_packaging_copy_sync.py",
]
PRIOR = "scripts/ci/assert-score-lift-round141-batch.py"

def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 142 drift — missing files:", file=sys.stderr)
        for item in missing:
            print(f"  - {item}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / PRIOR
    if prior.is_file():
        completed = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if completed.returncode != 0:
            return completed.returncode
    print("Score lift round 142 batch modules present.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
