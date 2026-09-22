"""Drift guards for architecture-quality ROI batch 15 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch15DriftGuards(unittest.TestCase):
    def test_persistent_sponsor_email_strip_export_honesty(self) -> None:
        strip = (_UI / "src/components/usability/PersistentSponsorEmailStrip.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorExportSendHonestyStrip", strip)
        self.assertIn("persistent-sponsor-email", strip)

    def test_review_package_sponsor_handoff_export_honesty(self) -> None:
        handoff = (
            _UI / "src/app/(operator)/architecture/reviews/[reviewId]/_sections/ReviewPackageSponsorHandoffStrip.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", handoff)
        self.assertIn("review-package-sponsor-handoff", handoff)
        self.assertLess(
            handoff.index("SponsorExportSendHonestyStrip"),
            handoff.index("review-package-sponsor-handoff-more-exports"),
        )

    def test_help_findings_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpFindingsGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-findings", guide)

    def test_help_first_review_and_review_guide_send_path_honesty(self) -> None:
        first_review = (
            _UI / "src/app/(operator)/help/_sections/HelpFirstReviewEvidenceChecklistGuideView.tsx"
        ).read_text(encoding="utf-8")
        review = (_UI / "src/app/(operator)/help/_sections/HelpReviewGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", first_review)
        self.assertIn("help-first-review", first_review)
        self.assertIn("SponsorSendPathHonestyPanel", review)
        self.assertIn("help-review", review)

    def test_digests_browse_export_honesty(self) -> None:
        panel = (_UI / "src/components/digests/DigestsBrowseDetailPanel.tsx").read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", panel)
        self.assertIn("digests-browse-export", panel)

    def test_help_repeat_review_loop_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpRepeatReviewLoopGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-repeat-review-loop", guide)


if __name__ == "__main__":
    unittest.main()
