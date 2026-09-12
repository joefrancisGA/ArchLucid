"""Drift guards for architecture-quality ROI batch 10 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch10DriftGuards(unittest.TestCase):
    def test_compare_summary_formatter_wires_verdict_chrome_export(self) -> None:
        text = (
            _REPO / "ArchLucid.Application/Analysis/MarkdownEndToEndReplayComparisonSummaryFormatter.cs"
        ).read_text(encoding="utf-8")

        self.assertIn("CompareVerdictChromeExportFormatter.AppendMarkdown", text)

    def test_core_pilot_help_surfaces_sponsor_honesty(self) -> None:
        panel = (_UI / "src/app/(operator)/help/_sections/CorePilotHelpPostStepperPanel.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", panel)
        self.assertIn("core-pilot", panel)
        self.assertIn("CORE_PILOT_HELP_SPONSOR_HONESTY_TITLE", panel)

    def test_scorecard_roi_panel_includes_non_summing_and_wk21(self) -> None:
        panel = (
            _UI
            / "src/app/(operator)/insights/architecture-scorecard/_sections/PilotScorecardRoiPanel.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE", panel)
        self.assertIn("PolicyPackInfluenceHonestyChip", panel)

    def test_board_pack_and_value_report_include_honesty_lines(self) -> None:
        board_pack = (_REPO / "ArchLucid.Application/Pilots/BoardPackPdfBuilder.cs").read_text(encoding="utf-8")
        value_report = (
            _REPO / "ArchLucid.Application/Value/ValueReportSnapshotMarkdownFormatter.cs"
        ).read_text(encoding="utf-8")

        self.assertIn("SendableExportCoverComposer.SponsorRoiNonSummingHeadlineLine", board_pack)
        self.assertIn("SendableExportCoverComposer.PolicyPackInfluenceHonestyLine", board_pack)
        self.assertIn("SendableExportCoverComposer.SponsorRoiNonSummingHeadlineLine", value_report)

    def test_operator_home_recommended_next_disposition_helper(self) -> None:
        card = (_UI / "src/components/operator-home/OperatorHomeRecommendedNextCard.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("operator-home-recommended-next-disposition", card)
        self.assertNotIn("OperatorHomeExecutiveRoiStrip", card)

    def test_wizard_evidence_sources_include_evidence_only_fast_path(self) -> None:
        options = (_UI / "src/lib/wizard-evidence-source-options.ts").read_text(encoding="utf-8")

        self.assertIn("evidence-only fast path", options.lower())

    def test_stale_executive_roi_strip_removed(self) -> None:
        stale = _UI / "src/components/operator-home/OperatorHomeExecutiveRoiStrip.tsx"
        self.assertFalse(stale.exists())


if __name__ == "__main__":
    unittest.main()
