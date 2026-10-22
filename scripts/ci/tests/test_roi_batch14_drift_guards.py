"""Drift guards for architecture-quality ROI batch 14 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch14DriftGuards(unittest.TestCase):
    def test_help_roi_summary_send_path_orientation(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpRoiSummaryGuideView.tsx").read_text(
            encoding="utf-8",
        )
        strip = (_UI / "src/app/(operator)/help/_sections/HelpRoiSummaryClaimOrientationStrip.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("HelpRoiSummaryClaimOrientationStrip", guide)
        self.assertIn("help-roi-summary-non-summing-line", strip)
        self.assertIn("SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE", strip)

    def test_sponsor_roi_summary_export_cta_and_markdown_cover(self) -> None:
        section = (
            _UI / "src/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiSummarySection.tsx"
        ).read_text(encoding="utf-8")
        markdown = (_UI / "src/lib/sponsor/sponsor-summary-markdown.ts").read_text(encoding="utf-8")
        test = (_UI / "src/lib/sponsor/sponsor-report-markdown.test.ts").read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", section)
        self.assertIn("sponsor-roi-summary-export", section)
        self.assertIn("SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE", markdown)
        self.assertIn("POLICY_PACK_INFLUENCE_HONESTY_LINE", markdown)
        self.assertIn("sendable export cover honesty lines", test)

    def test_run_detail_header_export_honesty(self) -> None:
        header = (_UI / "src/components/runs/RunDetailPageHeader.tsx").read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", header)
        self.assertIn("run-detail-header-export", header)

    def test_help_review_packages_and_pilot_guide_orientation(self) -> None:
        review_packages = (
            _UI / "src/app/(operator)/help/_sections/HelpReviewPackagesGuideView.tsx"
        ).read_text(encoding="utf-8")
        pilot_guide = (_UI / "src/app/(operator)/help/_sections/HelpPilotGuideView.tsx").read_text(
            encoding="utf-8",
        )
        pilot_strip = (
            _UI / "src/app/(operator)/help/_sections/HelpPilotGuideClaimOrientationStrip.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", review_packages)
        self.assertIn("help-review-packages", review_packages)
        self.assertIn("SponsorSendPathHonestyPanel", pilot_guide)
        self.assertIn("help-pilot-guide-non-summing-line", pilot_strip)

    def test_help_baseline_settings_orientation(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpBaselineSettingsGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-baseline-settings", guide)

    def test_first_week_in_progress_disposition_and_comparison_replay_help(self) -> None:
        guidance = (_UI / "src/lib/first-week-route-guidance.ts").read_text(encoding="utf-8")
        comparison_help = (
            _UI / "src/app/(operator)/help/_sections/HelpComparisonReplayGuideView.tsx"
        ).read_text(encoding="utf-8")

        in_progress_block = guidance.split("BUYER_REVIEW_DETAIL_IN_PROGRESS_GUIDANCE", maxsplit=1)[1].split(
            "WORKING_REVIEW_DETAIL_IN_PROGRESS_GUIDANCE",
            maxsplit=1,
        )[0]
        working_block = guidance.split("WORKING_REVIEW_DETAIL_IN_PROGRESS_GUIDANCE", maxsplit=1)[1].split(
            "export const FIRST_WEEK_ROUTE_GUIDANCE_REVIEW_DETAIL_COMMITTED",
            maxsplit=1,
        )[0]

        self.assertIn("dispositionBeforeSponsorNote", in_progress_block)
        self.assertIn("dispositionBeforeSponsorNote", working_block)
        self.assertIn("SponsorSendPathHonestyPanel", comparison_help)
        self.assertIn("help-comparison-replay", comparison_help)


if __name__ == "__main__":
    unittest.main()
