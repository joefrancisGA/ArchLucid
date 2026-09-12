"""Drift guards for architecture-quality ROI batch 23 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch23DriftGuards(unittest.TestCase):
    def test_compliance_drift_pdf_export_honesty(self) -> None:
        export = (_UI / "src/components/ComplianceDriftChartPdfExport.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorExportSendHonestyStrip", export)
        self.assertIn("compliance-drift-pdf-export", export)

    def test_help_dpa_template_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpDpaTemplateGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-dpa-template", guide)

    def test_help_subprocessors_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpSubprocessorsGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-subprocessors", guide)

    def test_help_connect_azure_securely_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpConnectAzureSecurelyGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertGreaterEqual(guide.count("SponsorSendPathHonestyPanel"), 2)
        self.assertIn("help-connect-azure-securely", guide)

    def test_help_security_trust_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpSecurityTrustGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-security-trust", guide)

    def test_help_data_handling_tenant_isolation_send_path_honesty(self) -> None:
        guide = (
            _UI
            / "src/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-data-handling-tenant-isolation", guide)


if __name__ == "__main__":
    unittest.main()
