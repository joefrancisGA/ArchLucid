"""Drift guards for architecture-quality ROI batch 31 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch31DriftGuards(unittest.TestCase):
    def test_ai_usage_export_activity_honesty(self) -> None:
        panel = (
            _UI
            / "src/app/(operator)/administration/ai-usage/_sections/ai-usage/AiUsageRecentActivityPanel.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", panel)
        self.assertIn("ai-usage-export-activity", panel)

    def test_help_admin_diagnostics_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpAdminDiagnosticsGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-admin-diagnostics", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_ai_usage_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpAiUsageGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-ai-usage", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_api_contracts_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpApiContractsGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-api-contracts", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_engineering_troubleshooting_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpEngineeringTroubleshootingGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-engineering-troubleshooting", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_cli_usage_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpCliUsageTechnicalReferenceView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-cli-usage", guide)
        self.assertIn("showSsoOptional={false}", guide)


if __name__ == "__main__":
    unittest.main()
