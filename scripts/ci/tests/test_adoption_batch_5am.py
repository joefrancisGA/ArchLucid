"""TB-224 AI compare narrative drift guards (Batch 5AM)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AM(unittest.TestCase):
    def test_tb_224_ask_comparison_narrative_options(self) -> None:
        path = REPO_ROOT / "ArchLucid.Core" / "Configuration" / "AskComparisonNarrativeOptions.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("GenerateComparisonNarrative", text)

    def test_tb_224_ask_service_gates_narrative(self) -> None:
        path = REPO_ROOT / "ArchLucid.Host.Core" / "Services" / "Ask" / "AskService.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("GenerateComparisonNarrative", text)
        self.assertIn("ComparisonNarrativeSummaryBuilder", text)

    def test_tb_224_compare_ui_calls_ask_narrative(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "api" / "conversation-api.ts"
        text = path.read_text(encoding="utf-8")
        self.assertIn("fetchComparisonNarrativeViaAsk", text)
        self.assertIn("comparisonNarrative", text)

    def test_tb_224_compare_results_panel_shows_narrative(self) -> None:
        path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "insights"
            / "compare-two-reviews"
            / "_sections"
            / "CompareResultsPanel.tsx"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("compare-ask-narrative-banner", text)
        self.assertIn("AI narrative", text)

    def test_tb_224_host_core_tests_cover_narrative(self) -> None:
        path = REPO_ROOT / "ArchLucid.Host.Core.Tests" / "Ask" / "AskServiceComparisonNarrativeTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("AskAsync_returns_comparison_narrative_when_config_enabled_and_delta_exists", text)


if __name__ == "__main__":
    unittest.main()
