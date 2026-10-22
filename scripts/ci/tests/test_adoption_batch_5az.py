"""TB-245 ROI trend SVG chart drift guards (Batch 5AZ)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AZ(unittest.TestCase):
    def test_tb_245_svg_chart_component(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(operator)" / "architecture" / "sponsor-dashboard" / "_sections" / "SponsorRoiSavingsTrendSvgChart.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("<svg", text)
        self.assertIn("exec-roi-trend-svg-chart", text)

    def test_tb_245_trend_section_wires_svg(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(operator)" / "architecture" / "sponsor-dashboard" / "_sections" / "SponsorRoiTrendSection.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("SponsorRoiSavingsTrendSvgChart", text)

    def test_tb_245_snapshot_test(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(operator)" / "architecture" / "sponsor-dashboard" / "_sections" / "SponsorRoiSavingsTrendSvgChart.test.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("toMatchSnapshot", text)


if __name__ == "__main__":
    unittest.main()
