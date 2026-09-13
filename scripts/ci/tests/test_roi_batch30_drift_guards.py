"""Drift guards for architecture-quality ROI batch 30 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch30DriftGuards(unittest.TestCase):
    def test_infra_diagrams_export_honesty(self) -> None:
        client = (
            _UI / "src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", client)
        self.assertIn("infra-diagrams-export", client)
        self.assertIn("infra-diagrams-export-png", client)
        self.assertIn("infra-diagrams-export-mmd", client)

    def test_help_troubleshooting_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpTroubleshootingGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-troubleshooting", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_contact_support_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpContactSupportGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-contact-support", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_report_a_problem_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpReportAProblemGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-report-a-problem", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_preferences_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpPreferencesGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-preferences", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_pilot_feedback_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpPilotFeedbackGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-pilot-feedback", guide)
        self.assertIn("showSsoOptional={false}", guide)


if __name__ == "__main__":
    unittest.main()
