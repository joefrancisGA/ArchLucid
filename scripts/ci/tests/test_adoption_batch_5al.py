"""TB-239 sponsor ROI history run-mode label drift guards (Batch 5AL)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AL(unittest.TestCase):
    def test_tb_239_history_contract_exposes_run_mode_fields(self) -> None:
        path = REPO_ROOT / "ArchLucid.Contracts" / "Roi" / "SponsorRoiHistoryResponse.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("RealRunCount", text)
        self.assertIn("SimulatorRunCount", text)
        self.assertIn("RealModeSavingsUsd", text)
        self.assertIn("IsMixedMode", text)

    def test_tb_239_run_mode_calculator_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Application" / "Roi" / "SponsorRoiHistoryRunModeCalculator.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("ComputeRealModeSavingsUsd", text)
        self.assertIn("IsMixedMode", text)

    def test_tb_239_trend_section_labels_mixed_and_simulator_only(self) -> None:
        path = (
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
        text = path.read_text(encoding="utf-8")
        self.assertIn("realRunCount", text)
        self.assertIn("exec-roi-trend-mixed-mode-footnote", text)
        self.assertIn("Simulator-only", text)

    def test_tb_239_extended_service_test_covers_pro_rated_savings(self) -> None:
        path = REPO_ROOT / "ArchLucid.Application.Tests" / "Roi" / "SponsorRoiSummaryServiceExtendedTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("BuildHistoryAsync_pro_rates_savings_by_real_and_simulator_run_counts", text)

    def test_tb_239_vitest_covers_trend_section(self) -> None:
        path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "architecture"
            / "sponsor-dashboard"
            / "_sections"
            / "SponsorRoiTrendSection.test.tsx"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("exec-roi-trend-mixed-mode-footnote", text)


if __name__ == "__main__":
    unittest.main()
