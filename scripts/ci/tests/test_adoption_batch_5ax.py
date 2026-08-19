"""TB-244 KPI drill-through drift guards (Batch 5AX)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AX(unittest.TestCase):
    def test_tb_244_kpi_links(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(operator)" / "architecture" / "sponsor-dashboard" / "_sections" / "SponsorRoiDashboardLiveKpiCards.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("KpiTileDrillThroughLink", text)
        self.assertIn("kpi-tile-stale-risks-link", text)
        hrefs = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "lib"
            / "sponsor"
            / "sponsor-kpi-drill-through-hrefs.ts"
        )
        self.assertIn("filter=stale", hrefs.read_text(encoding="utf-8"))

    def test_tb_244_orphan_card_link(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(operator)" / "architecture" / "sponsor-dashboard" / "_sections" / "SponsorOrphanCandidatesCard.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("kpi-tile-orphan-candidates-link", text)
        self.assertIn("orphan-candidates", text)

    def test_tb_244_vitest(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(operator)" / "architecture" / "sponsor-dashboard" / "_sections" / "SponsorRoiDashboardLiveKpiCards.test.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("kpi-tile-resolved-30d-link", text)


if __name__ == "__main__":
    unittest.main()
