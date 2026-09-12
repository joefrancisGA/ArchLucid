"""Drift guards for architecture-quality ROI batch 28 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch28DriftGuards(unittest.TestCase):
    def test_infra_drift_export_terraform_honesty(self) -> None:
        client = (
            _UI / "src/app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", client)
        self.assertIn("infra-drift-export-terraform", client)

    def test_help_model_governance_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpModelGovernanceGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-model-governance", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_scope_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpScopeGuideView.tsx").read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-scope", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_alerts_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpAlertsGuideView.tsx").read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-alerts", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_notifications_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpNotificationsGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-notifications", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_system_health_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpSystemHealthGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-system-health", guide)
        self.assertIn("showSsoOptional={false}", guide)


if __name__ == "__main__":
    unittest.main()
