"""TB-248 pilot day badge drift guards (Batch 5BA)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5BA(unittest.TestCase):
    def test_tb_248_contract_field(self) -> None:
        path = REPO_ROOT / "ArchLucid.Contracts" / "Roi" / "SponsorRoiSummaryResponse.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("FirstCommitUtc", text)

    def test_tb_248_ui_badge(self) -> None:
        path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "architecture"
            / "sponsor-dashboard"
            / "_sections"
            / "SponsorRoiDashboardLiveKpiCards.tsx"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("exec-kpi-pilot-day-badge", text)
        self.assertIn("Day", text)
        self.assertIn("ArchLucid pilot", text)


if __name__ == "__main__":
    unittest.main()
