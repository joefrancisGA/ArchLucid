"""Drift guards for architecture-quality ROI batch 12 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch12DriftGuards(unittest.TestCase):
    def test_weekly_sponsor_email_cover_honesty(self) -> None:
        summary_model = (
            _REPO / "ArchLucid.Application/Notifications/Email/Models/WeeklySponsorSummaryEmailModel.cs"
        ).read_text(encoding="utf-8")
        report_model = (
            _REPO / "ArchLucid.Application/Notifications/Email/Models/WeeklyExecutiveSummaryEmailModel.cs"
        ).read_text(encoding="utf-8")
        summary_template = (
            _REPO / "ArchLucid.Notifications.Email.RazorLight/Templates/WeeklySponsorSummary.cshtml"
        ).read_text(encoding="utf-8")
        report_template = (
            _REPO / "ArchLucid.Notifications.Email.RazorLight/Templates/WeeklySponsorReport.cshtml"
        ).read_text(encoding="utf-8")

        for source in (summary_model, report_model):
            self.assertIn("SponsorRoiNonSummingLine", source)
            self.assertIn("PolicyPackInfluenceHonestyLine", source)
            self.assertIn("SendableExportCoverComposer", source)

        for template in (summary_template, report_template):
            self.assertIn("Sponsor ROI honesty:", template)
            self.assertIn("Policy influence:", template)

    def test_help_sponsor_report_orientation_honesty(self) -> None:
        strip = (
            _UI / "src/app/(operator)/help/_sections/HelpSponsorReportClaimOrientationStrip.tsx"
        ).read_text(encoding="utf-8")
        guide = (_UI / "src/app/(operator)/help/_sections/HelpSponsorSummaryGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE", strip)
        self.assertIn("PolicyPackInfluenceHonestyChip", strip)
        self.assertIn("help-sponsor-report-non-summing-line", strip)
        self.assertIn("SponsorSendPathHonestyPanel", guide)

    def test_roi_summary_hero_honesty(self) -> None:
        hero = (_UI / "src/app/(operator)/insights/roi-summary/_sections/RoiSummaryHeroStrip.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE", hero)
        self.assertIn("PolicyPackInfluenceHonestyChip", hero)
        self.assertIn("roi-summary-hero-non-summing", hero)

    def test_sponsor_export_cta_honesty_strip(self) -> None:
        shared = (_UI / "src/components/exports/SponsorExportSendHonestyStrip.tsx").read_text(encoding="utf-8")
        sponsor_exports = (
            _UI / "src/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorExportsSection.tsx"
        ).read_text(encoding="utf-8")
        run_detail = (
            _UI
            / "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailArtifactsExportsSection.tsx"
        ).read_text(encoding="utf-8")
        pilot_exports = (
            _UI / "src/app/(operator)/insights/sponsor-report/_sections/PilotValueReportExportControls.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE", shared)
        self.assertIn("FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY", shared)
        self.assertIn("SponsorExportSendHonestyStrip", sponsor_exports)
        self.assertIn("SponsorExportSendHonestyStrip", run_detail)
        self.assertIn("SponsorExportSendHonestyStrip", pilot_exports)

    def test_compare_end_to_end_export_wiring(self) -> None:
        diff_stack = (
            _UI / "src/app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelDiffStack.tsx"
        ).read_text(encoding="utf-8")
        spec = (_UI / "e2e/compare-journey.spec.ts").read_text(encoding="utf-8")
        schemas = (_UI / "src/lib/api-types/schemas.generated.ts").read_text(encoding="utf-8")

        self.assertIn("downloadEndToEndCompareExport", diff_stack)
        self.assertIn("compare-download-end-to-end-compare-export-button", diff_stack)
        self.assertIn("compare-download-end-to-end-compare-export-button", spec)
        self.assertIn("Compare Verdict Chrome Delta", spec)
        self.assertIn("compareVerdictChromeDelta", schemas)

    def test_first_week_home_and_getting_started_sso(self) -> None:
        guidance = (_UI / "src/lib/first-week-route-guidance.ts").read_text(encoding="utf-8")
        getting_started = (_UI / "src/app/(operator)/help/_sections/HelpGettingStartedGuideView.tsx").read_text(
            encoding="utf-8",
        )
        optional_setup = (
            _UI / "src/app/(operator)/architecture/first-review-guide/_sections/OptionalWorkspaceSetupList.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("home: {", guidance)
        self.assertIn('"reviews-list": {', guidance)
        self.assertIn("dispositionBeforeSponsorNote: FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY", guidance)
        self.assertIn("showSsoOptional={true}", getting_started)
        self.assertIn("SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE", optional_setup)

    def test_docx_value_report_and_live_kpi_honesty(self) -> None:
        docx = (_REPO / "ArchLucid.ArtifactSynthesis/Docx/DocxValueReportRenderer.cs").read_text(encoding="utf-8")
        live_kpis = (
            _UI / "src/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiDashboardLiveKpiCards.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("Sendable export cover", docx)
        self.assertIn("Portfolio headline savings are disposition-aware and deduplicated by FindingId", docx)
        self.assertIn("Pack-mapped findings cite assigned policy rules", docx)
        self.assertIn("SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE", live_kpis)
        self.assertIn("exec-kpi-live-non-summing", live_kpis)


if __name__ == "__main__":
    unittest.main()
