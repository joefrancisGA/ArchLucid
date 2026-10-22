"""Drift guards for architecture-quality ROI batch 13 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch13DriftGuards(unittest.TestCase):
    def test_pilot_value_report_markdown_sendable_cover(self) -> None:
        formatter = (
            _REPO / "ArchLucid.Application/Pilots/PilotValueReportMarkdownFormatter.cs"
        ).read_text(encoding="utf-8")
        tests = (
            _REPO / "ArchLucid.Application.Tests/Pilots/PilotValueReportMarkdownFormatterTests.cs"
        ).read_text(encoding="utf-8")

        self.assertIn("SendableExportCoverComposer", formatter)
        self.assertIn("SponsorRoiNonSummingHeadlineLine", formatter)
        self.assertIn("PolicyPackInfluenceHonestyLine", formatter)
        self.assertIn("Format_includes_sendable_export_cover_honesty_lines", tests)

    def test_pilot_outcomes_email_mailto_send_honesty(self) -> None:
        dialog = (
            _UI / "src/app/(operator)/insights/sponsor-report/_sections/PilotOutcomesEmailConfirmDialog.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", dialog)
        self.assertIn("pilot-outcomes-email", dialog)

    def test_help_sponsor_dashboard_and_scorecard_orientation(self) -> None:
        sponsor_dashboard = (
            _UI / "src/app/(operator)/help/_sections/HelpSponsorDashboardGuideView.tsx"
        ).read_text(encoding="utf-8")
        scorecard_guide = (
            _UI / "src/app/(operator)/help/_sections/HelpArchitectureScorecardGuideView.tsx"
        ).read_text(encoding="utf-8")
        scorecard_strip = (
            _UI / "src/app/(operator)/help/_sections/HelpArchitectureScorecardClaimOrientationStrip.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", sponsor_dashboard)
        self.assertIn("help-sponsor-dashboard", sponsor_dashboard)
        self.assertIn("SponsorSendPathHonestyPanel", scorecard_guide)
        self.assertIn("HelpArchitectureScorecardClaimOrientationStrip", scorecard_guide)
        self.assertIn("SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE", scorecard_strip)
        self.assertIn("PolicyPackInfluenceHonestyChip", scorecard_strip)
        self.assertIn("help-architecture-scorecard-non-summing-line", scorecard_strip)

    def test_first_week_onboarding_and_new_review_disposition(self) -> None:
        guidance = (_UI / "src/lib/first-week-route-guidance.ts").read_text(encoding="utf-8")

        self.assertIn("onboarding: {", guidance)
        self.assertIn('"new-review": {', guidance)
        self.assertIn("dispositionBeforeSponsorNote: FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY", guidance)
        onboarding_block = guidance.split("onboarding: {", maxsplit=1)[1].split('"new-review": {', maxsplit=1)[0]
        new_review_block = guidance.split('"new-review": {', maxsplit=1)[1].split('"reviews-list": {', maxsplit=1)[0]

        self.assertIn("dispositionBeforeSponsorNote", onboarding_block)
        self.assertIn("dispositionBeforeSponsorNote", new_review_block)

    def test_golden_manifest_export_cta_honesty(self) -> None:
        menu = (_UI / "src/components/GoldenManifestExportMenu.tsx").read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", menu)
        self.assertIn("golden-manifest-export", menu)

    def test_compare_export_action_bar_honesty(self) -> None:
        diff_stack = (
            _UI / "src/app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelDiffStack.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", diff_stack)
        self.assertIn("compare-export", diff_stack)
        self.assertIn("compare-results-action-bar", diff_stack)

    def test_executive_sponsor_details_and_pilot_roi_help_honesty(self) -> None:
        live_kpis = (
            _UI / "src/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiDashboardLiveKpiCards.tsx"
        ).read_text(encoding="utf-8")
        pilot_roi_help = (
            _UI / "src/app/(operator)/help/_sections/HelpPilotRoiMeasurementSection.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("exec-kpi-sponsor-details-non-summing", live_kpis)
        self.assertIn("SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE", live_kpis)
        self.assertIn("SponsorSendPathHonestyPanel", pilot_roi_help)
        self.assertIn("help-pilot-roi-measurement", pilot_roi_help)


if __name__ == "__main__":
    unittest.main()
