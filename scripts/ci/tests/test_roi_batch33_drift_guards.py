"""Drift guards for architecture-quality ROI batch 33 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch33DriftGuards(unittest.TestCase):
    def test_review_header_share_export_honesty(self) -> None:
        menu = (_UI / "src/components/reviews/ReviewHeaderShareMenu.tsx").read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", menu)
        self.assertIn("review-header-share-export", menu)
        self.assertIn("review-header-share-menu-exports", menu)

    def test_review_meeting_packet_export_honesty(self) -> None:
        button = (_UI / "src/components/reviews/ReviewMeetingPacketButton.tsx").read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", button)
        self.assertIn("review-meeting-packet-export", button)
        self.assertIn("review-meeting-packet-trigger", button)

    def test_whitelabel_consulting_export_honesty(self) -> None:
        button = (_UI / "src/components/ReviewBoardWhitelabelConsultingExportButton.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorExportSendHonestyStrip", button)
        self.assertIn("whitelabel-consulting-export", button)
        self.assertIn("whitelabel-export-modal", button)
        self.assertIn("whitelabel-consulting-export-submit", button)

    def test_package_print_export_honesty(self) -> None:
        button = (_UI / "src/components/reviews/PackagePrintButton.tsx").read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", button)
        self.assertIn("package-print-export", button)
        self.assertIn("package-print-pdf", button)

    def test_cto_demo_leave_behind_export_honesty(self) -> None:
        button = (_UI / "src/components/cto-demo/CtoDemoLeaveBehindExportButton.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorExportSendHonestyStrip", button)
        self.assertIn("cto-demo-leave-behind-export", button)

    def test_cto_demo_audit_integrity_export_honesty(self) -> None:
        button = (_UI / "src/components/cto-demo/CtoDemoAuditIntegrityExportButton.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorExportSendHonestyStrip", button)
        self.assertIn("cto-demo-audit-integrity-export", button)


if __name__ == "__main__":
    unittest.main()
