#!/usr/bin/env python3
"""Drift guard — score lift round 144 (Wave C decision velocity + cognitive load)."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_PATHS = [
    "archlucid-ui/src/lib/reviews/compare-finalize-decision-velocity-copy.ts",
    "archlucid-ui/src/components/reviews/CompareFinalizeDecisionNextStrip.tsx",
    "archlucid-ui/src/lib/reviews/reviews-hub-decision-blocker-queue.ts",
    "archlucid-ui/src/components/reviews/ReviewsHubDecisionBlockerQueueStrip.tsx",
    "archlucid-ui/src/lib/reviews/review-workspace-unified-search-honesty-copy.ts",
    "archlucid-ui/src/components/reviews/ReviewWorkspaceUnifiedSearchHonestyStrip.tsx",
    "archlucid-ui/src/lib/reviews/review-workspace-lifecycle-progress-copy.ts",
    "archlucid-ui/src/components/reviews/ReviewWorkspaceLifecycleProgressStepper.tsx",
    "archlucid-ui/src/lib/reviews/review-workspace-tab-cognitive-load-copy.ts",
    "archlucid-ui/src/components/reviews/ReviewWorkspaceTabCognitiveNextStep.tsx",
    "archlucid-ui/src/lib/score-lift-round144-batch-honesty.test.ts",
    "archlucid-ui/src/lib/score-lift-round144-wave-c-mounted-contract.test.ts",
]
PRIOR = "scripts/ci/assert-score-lift-round142-batch.py"


def main() -> int:
    missing = [r for r in REQUIRED_PATHS if not (REPO_ROOT / r).is_file()]
    if missing:
        print("Score lift round 144 drift — missing files:", file=sys.stderr)
        for item in missing:
            print(f"  - {item}", file=sys.stderr)
        return 1
    prior = REPO_ROOT / PRIOR
    if prior.is_file():
        completed = subprocess.run([sys.executable, str(prior)], cwd=REPO_ROOT)
        if completed.returncode != 0:
            return completed.returncode
    print("Score lift round 144 batch modules present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
