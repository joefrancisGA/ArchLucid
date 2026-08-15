"""TB-267 / TB-268 / TB-269 sponsor value visibility drift guards (Batch 5CO)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestExecutiveValueBatch5CO(unittest.TestCase):
    def test_tb_267_executive_dashboard_route(self) -> None:
        page = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(operator)" / "architecture" / "sponsor-dashboard" / "page.tsx"
        view = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "architecture"
            / "sponsor-dashboard"
            / "_sections"
            / "SponsorRoiDashboardPageView.tsx"
        )
        shell = REPO_ROOT / "archlucid-ui" / "src" / "components" / "ExecutiveShellFrame.tsx"
        traffic = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "lib"
            / "ui-route-traffic-architecture-sponsor-dashboard.ts"
        )
        self.assertTrue(page.is_file())
        self.assertIn("SponsorRoiDashboardPageView", page.read_text(encoding="utf-8"))
        self.assertIn("surface", view.read_text(encoding="utf-8"))
        self.assertIn("EXECUTIVE_DASHBOARD_HREF", shell.read_text(encoding="utf-8"))
        traffic_text = traffic.read_text(encoding="utf-8")
        self.assertIn('LEGACY_EXECUTIVE_SHELL_DASHBOARD_PATH = "/sponsor/dashboard"', traffic_text)
        self.assertIn("hard-retired", traffic_text)

    def test_tb_268_executive_value_narrative(self) -> None:
        helper = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "sponsor-value-narrative.ts"
        banner = REPO_ROOT / "archlucid-ui" / "src" / "components" / "ExecutiveValueNarrativeBanner.tsx"
        self.assertTrue(helper.is_file())
        self.assertIn("buildExecutiveValueNarrative", banner.read_text(encoding="utf-8"))

    def test_tb_269_roi_trend_time_range_selector(self) -> None:
        trend = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "architecture"
            / "sponsor-dashboard"
            / "_sections"
            / "SponsorRoiTrendSection.tsx"
        )
        text = trend.read_text(encoding="utf-8")
        self.assertIn("exec-roi-trend-time-range", text)
        self.assertIn("filterHistoryPointsByRange", text)


if __name__ == "__main__":
    unittest.main()
