"""Drift guards for architecture-quality ROI batch 25 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch25DriftGuards(unittest.TestCase):
    def test_decision_register_export_honesty(self) -> None:
        export = (
            _UI / "src/app/(operator)/governance/decision-register/DecisionRegisterExportButton.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", export)
        self.assertIn("decision-register-export", export)

    def test_help_sealed_vs_decision_register_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpSealedVsDecisionRegisterGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-sealed-vs-decision-register", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_which_mode_am_i_in_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpWhichModeAmIInGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-which-mode-am-i-in", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_inspect_stored_evidence_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpInspectStoredEvidenceGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-inspect-stored-evidence", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_background_wait_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpBackgroundWaitGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-background-wait", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_proxy_timeout_real_execute_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpProxyTimeoutRealExecuteGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-proxy-timeout-real-execute", guide)
        self.assertIn("showSsoOptional={false}", guide)


if __name__ == "__main__":
    unittest.main()
