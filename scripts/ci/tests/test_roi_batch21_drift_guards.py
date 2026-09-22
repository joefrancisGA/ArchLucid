"""Drift guards for architecture-quality ROI batch 21 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch21DriftGuards(unittest.TestCase):
    def test_review_package_share_when_to_share_export_honesty(self) -> None:
        preview = (_UI / "src/components/ReviewPackageShareWhenToSharePreview.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorExportSendHonestyStrip", preview)
        self.assertIn("review-package-share-when-to-share", preview)

    def test_help_slack_integration_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpSlackIntegrationGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-slack-integration", guide)

    def test_help_jira_integration_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpJiraIntegrationGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-jira-integration", guide)

    def test_help_servicenow_integration_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpServiceNowIntegrationGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-servicenow-integration", guide)

    def test_help_webhooks_integration_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpWebhooksIntegrationGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-webhooks-integration", guide)

    def test_help_working_career_rehearsal_doors_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpWorkingCareerRehearsalGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-career-rehearsal-doors", guide)


if __name__ == "__main__":
    unittest.main()
