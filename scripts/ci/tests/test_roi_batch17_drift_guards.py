"""Drift guards for architecture-quality ROI batch 17 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch17DriftGuards(unittest.TestCase):
    def test_email_run_to_sponsor_export_actions_honesty(self) -> None:
        actions = (_UI / "src/components/EmailRunToSponsorExportActions.tsx").read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", actions)
        self.assertIn("email-run-to-sponsor-export", actions)

    def test_help_evidence_intake_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpEvidenceIntakeGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-evidence-intake", guide)

    def test_help_enterprise_onboarding_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpEnterpriseOnboardingGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-enterprise-onboarding", guide)

    def test_help_recurrence_schedules_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpRecurrenceSchedulesGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-recurrence-schedules", guide)

    def test_help_audit_trail_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpAuditTrailGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-audit-trail", guide)

    def test_help_decision_register_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpDecisionRegisterGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-decision-register", guide)


if __name__ == "__main__":
    unittest.main()
