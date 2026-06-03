"""TB-247 scorecard recommended actions drift guards (Batch 5AY)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AY(unittest.TestCase):
    def test_tb_247_scorecard_card(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(executive)" / "executive" / "scorecard" / "ExecutiveScorecardClient.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Recommended actions", text)
        self.assertIn("buildExecutiveScorecardRecommendedActions", text)
        self.assertIn("executive-scorecard-recommended-actions", text)

    def test_tb_247_derivation_module(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "executive-scorecard-recommended-actions.ts"
        text = path.read_text(encoding="utf-8")
        self.assertIn("orphan-candidates", text)
        client = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(executive)" / "executive" / "scorecard" / "ExecutiveScorecardClient.tsx"
        self.assertIn("No actions needed", client.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
