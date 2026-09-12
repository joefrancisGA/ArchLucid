"""Drift guards for architecture-quality ROI batch 27 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch27DriftGuards(unittest.TestCase):
    def test_governance_resolution_export_honesty(self) -> None:
        controls = (
            _UI / "src/app/(operator)/governance/standards-and-rules/_sections/GovernanceResolutionExportControls.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", controls)
        self.assertIn("governance-resolution-export", controls)

    def test_help_users_and_roles_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpUsersAndRolesGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-users-and-roles", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_workspace_settings_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpWorkspaceSettingsGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-workspace-settings", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_billing_and_plans_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpBillingAndPlansGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-billing-and-plans", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_connection_status_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpConnectionStatusGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-connection-status", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_api_keys_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpApiKeysGuideView.tsx").read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-api-keys", guide)
        self.assertIn("showSsoOptional={false}", guide)


if __name__ == "__main__":
    unittest.main()
