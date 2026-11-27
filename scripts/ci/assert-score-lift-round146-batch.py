#!/usr/bin/env python3
"""Drift guard — score lift round 146 (Wave E SecureNow packaging + procurement)."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/product-line/securenow-quote-packet-meter-table-footnote-copy.ts",
    "archlucid-ui/src/components/product-line/SecureNowQuotePacketMeterTableFootnote.tsx",
    "archlucid-ui/src/lib/product-line/securenow-billing-plan-comparison-copy.ts",
    "archlucid-ui/src/components/product-line/SecureNowArchLucidBillingComparisonStrip.tsx",
    "archlucid-ui/src/lib/product-line/securenow-pilot-decision-in-progress-cta-copy.ts",
    "archlucid-ui/src/components/product-line/SecureNowPilotDecisionInProgressCtaStrip.tsx",
    "archlucid-ui/src/lib/product-line/securenow-first-hour-marketing-entry-copy.ts",
    "archlucid-ui/src/components/product-line/SecureNowFirstHourMarketingSkuBand.tsx",
    "archlucid-ui/src/lib/score-lift-round146-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round146-wave-e-mounted-contract.test.ts",
]
PRIOR = "scripts/ci/assert-score-lift-round145-batch.py"


def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 146 drift — missing files:", file=sys.stderr)
        for item in missing:
            print(f"  - {item}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / PRIOR
    if prior.is_file():
        completed = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if completed.returncode != 0:
            return completed.returncode
    print("Score lift round 146 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
