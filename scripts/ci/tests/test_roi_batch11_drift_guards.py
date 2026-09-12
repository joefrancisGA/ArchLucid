"""Drift guards for architecture-quality ROI batch 11 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch11DriftGuards(unittest.TestCase):
    def test_sponsor_report_surfaces_non_summing_and_wk21(self) -> None:
        strip = (
            _UI / "src/app/(operator)/insights/sponsor-report/_sections/PilotOutcomesClaimOrientationStrip.tsx"
        ).read_text(encoding="utf-8")
        metrics = (
            _UI / "src/app/(operator)/insights/sponsor-report/_sections/PilotValueReportMetricsSection.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE", strip)
        self.assertIn("PolicyPackInfluenceHonestyChip", strip)
        self.assertIn("pilot-outcomes-non-summing-line", strip)
        self.assertIn("SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE", metrics)

    def test_exec_digest_markdown_and_email_cover_honesty(self) -> None:
        formatter = (
            _REPO / "ArchLucid.Application/ExecDigest/ExecDigestCompositionMarkdownFormatter.cs"
        ).read_text(encoding="utf-8")
        email = (_REPO / "ArchLucid.Notifications.Email.RazorLight/Templates/ExecDigest.cshtml").read_text(
            encoding="utf-8",
        )
        deep_link = (
            _UI / "src/app/(marketing)/digest/sponsor/_sections/ExecDigestSponsorDeepLinkPanel.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SendableExportCoverComposer.SponsorRoiNonSummingHeadlineLine", formatter)
        self.assertIn("SendableExportCoverComposer.PolicyPackInfluenceHonestyLine", formatter)
        self.assertIn("SponsorRoiNonSummingLine", email)
        self.assertIn("digest-sponsor-roi-non-summing", deep_link)

    def test_sponsor_dashboard_page_kpi_honesty(self) -> None:
        summary = (
            _UI / "src/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiSummarySection.tsx"
        ).read_text(encoding="utf-8")
        metrics = (
            _UI / "src/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorDashboardPrimaryMetricsSection.tsx"
        ).read_text(encoding="utf-8")
        orientation = (
            _UI
            / "src/app/(operator)/architecture/sponsor-dashboard/_sections/ArchitectureSponsorDashboardClaimOrientationStrip.tsx"
        ).read_text(encoding="utf-8")
        roi_copy = (_UI / "src/lib/roi-summary-evidence-copy.ts").read_text(encoding="utf-8")

        self.assertIn("exec-roi-summary-non-summing", summary)
        self.assertIn("sponsor-primary-metrics-non-summing", metrics)
        self.assertIn("architecture-sponsor-dashboard-non-summing-line", orientation)
        self.assertIn("SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE", roi_copy)
        self.assertNotIn(
            '"Portfolio headline savings are disposition-aware and deduplicated by FindingId',
            roi_copy,
        )

    def test_first_week_committed_disposition_guidance(self) -> None:
        guidance = (_UI / "src/lib/first-week-route-guidance.ts").read_text(encoding="utf-8")
        component = (_UI / "src/components/FirstWeekRouteGuidance.tsx").read_text(encoding="utf-8")

        self.assertIn("dispositionBeforeSponsorNote", guidance)
        self.assertIn("FIRST_REVIEW_GUIDE_DISPOSITION_BEFORE_SPONSOR_COPY", guidance)
        self.assertIn("first-week-route-guidance-disposition-before-sponsor", component)

    def test_optional_setup_sso_benefit_uses_first_review_copy(self) -> None:
        setup = (
            _UI / "src/app/(operator)/architecture/first-review-guide/_sections/OptionalWorkspaceSetupList.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("FIRST_REVIEW_GUIDE_SSO_OPTIONAL_COPY", setup)

    def test_getting_started_and_core_pilot_share_sponsor_honesty_panel(self) -> None:
        shared = (_UI / "src/components/help/SponsorSendPathHonestyPanel.tsx").read_text(encoding="utf-8")
        core_pilot = (_UI / "src/app/(operator)/help/_sections/CorePilotHelpPostStepperPanel.tsx").read_text(
            encoding="utf-8",
        )
        getting_started = (_UI / "src/app/(operator)/help/_sections/HelpGettingStartedGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE", shared)
        self.assertIn("SponsorSendPathHonestyPanel", core_pilot)
        self.assertIn("SponsorSendPathHonestyPanel", getting_started)

    def test_compare_journey_witnesses_verdict_chrome_panels(self) -> None:
        spec = (_UI / "e2e/compare-journey.spec.ts").read_text(encoding="utf-8")

        self.assertIn("compare-gate-outcome-delta-panel", spec)
        self.assertIn("compare-pack-assignment-delta-panel", spec)

    def test_openapi_snapshot_exposes_compare_verdict_chrome_delta(self) -> None:
        snapshot = (_REPO / "ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json").read_text(
            encoding="utf-8",
        )

        self.assertIn("compareVerdictChromeDelta", snapshot)


if __name__ == "__main__":
    unittest.main()
