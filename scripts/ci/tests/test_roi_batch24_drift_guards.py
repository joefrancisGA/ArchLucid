"""Drift guards for architecture-quality ROI batch 24 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch24DriftGuards(unittest.TestCase):
    def test_audit_operator_export_honesty(self) -> None:
        section = (
            _UI / "src/app/(operator)/governance/audit/_sections/AuditOperatorExportSection.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", section)
        self.assertIn("audit-operator-export", section)

    def test_help_soc2_self_assessment_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpSoc2SelfAssessmentGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-soc2-self-assessment", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_connect_aws_securely_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpConnectAwsSecurelyGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-connect-aws-securely", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_connect_gcp_securely_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpConnectGcpSecurelyGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-connect-gcp-securely", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_accelerator_chooser_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpAcceleratorChooserGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-accelerator-chooser", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_authentication_sign_in_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpAuthenticationSignInGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-authentication-sign-in", guide)
        self.assertIn("showSsoOptional={true}", guide)


if __name__ == "__main__":
    unittest.main()
