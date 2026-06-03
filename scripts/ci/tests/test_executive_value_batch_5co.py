"""TB-267 / TB-268 / TB-269 executive value visibility drift guards (Batch 5CO)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestExecutiveValueBatch5CO(unittest.TestCase):
    def test_tb_267_executive_dashboard_route(self) -> None:
        page = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(executive)" / "executive" / "dashboard" / "page.tsx"
        shell = REPO_ROOT / "archlucid-ui" / "src" / "components" / "ExecutiveShellFrame.tsx"
        self.assertIn('surface="executive"', page.read_text(encoding="utf-8"))
        self.assertIn("/executive/dashboard", shell.read_text(encoding="utf-8"))

    def test_tb_268_executive_value_narrative(self) -> None:
        helper = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "executive-value-narrative.ts"
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
            / "dashboard"
            / "_sections"
            / "ExecutiveRoiTrendSection.tsx"
        )
        text = trend.read_text(encoding="utf-8")
        self.assertIn("exec-roi-trend-time-range", text)
        self.assertIn("filterHistoryPointsByRange", text)


if __name__ == "__main__":
    unittest.main()
