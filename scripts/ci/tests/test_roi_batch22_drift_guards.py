"""Drift guards for architecture-quality ROI batch 22 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch22DriftGuards(unittest.TestCase):
    def test_export_deliverable_dialog_export_honesty(self) -> None:
        dialog = (_UI / "src/components/usability/ExportDeliverableDialog.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorExportSendHonestyStrip", dialog)
        self.assertIn("export-deliverable", dialog)

    def test_help_path_chooser_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpPathChooserGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-path-chooser", guide)

    def test_help_azure_boards_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpAzureBoardsGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-azure-boards", guide)

    def test_help_procurement_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpProcurementGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-procurement", guide)

    def test_help_caiq_sig_response_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpCaiqSigResponseGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-caiq-sig-response", guide)

    def test_help_cloud_connections_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpCloudConnectionsGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-cloud-connections", guide)


if __name__ == "__main__":
    unittest.main()
