"""TB-247 scorecard recommended actions drift guards (Batch 5AY)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AY(unittest.TestCase):
    def test_tb_247_scorecard_card(self) -> None:
        path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "architecture"
            / "sponsor-dashboard"
            / "_sections"
            / "ExecutiveDashboardNextActionSection.tsx"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("buildExecutiveScorecardRecommendedActions", text)
        self.assertIn("sponsor-dashboard-next-action", text)
        vocab = (REPO_ROOT / "archlucid-ui" / "src" / "lib" / "buyer-surface-vocabulary.ts").read_text(
            encoding="utf-8"
        )
        self.assertIn("Recommended actions", vocab)

    def test_tb_247_derivation_module(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "sponsor-scorecard-recommended-actions.ts"
        text = path.read_text(encoding="utf-8")
        self.assertIn("orphan-candidates", text)
        copy = (REPO_ROOT / "archlucid-ui" / "src" / "lib" / "buyer-polish-copy.ts").read_text(encoding="utf-8")
        self.assertIn("No actions needed", copy)


if __name__ == "__main__":
    unittest.main()
