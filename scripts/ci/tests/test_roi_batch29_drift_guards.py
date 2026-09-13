"""Drift guards for architecture-quality ROI batch 29 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch29DriftGuards(unittest.TestCase):
    def test_infra_terraform_advisory_zip_export_honesty(self) -> None:
        client = (
            _UI / "src/app/(operator)/governance/infrastructure/terraform/TerraformWorkbenchClient.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", client)
        self.assertIn("infra-terraform-advisory-zip", client)

    def test_help_advisory_scans_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpAdvisoryScansGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-advisory-scans", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_architecture_drafts_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpArchitectureDraftsGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-architecture-drafts", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_architecture_draft_editing_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpArchitectureDraftEditingGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-architecture-draft-editing", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_azure_permissions_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpAzurePermissionsGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-azure-permissions", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_configuration_reference_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpConfigurationReferenceGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-configuration-reference", guide)
        self.assertIn("showSsoOptional={false}", guide)


if __name__ == "__main__":
    unittest.main()
