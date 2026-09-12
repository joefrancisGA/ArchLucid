"""Drift guards for architecture-quality ROI batch 19 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch19DriftGuards(unittest.TestCase):
    def test_review_package_share_row_export_honesty(self) -> None:
        row = (
            _UI
            / "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailReviewPackageShareRow.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", row)
        self.assertIn("review-package-share-row-export", row)

    def test_help_architecture_sharing_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpArchitectureSharingGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-architecture-sharing", guide)

    def test_help_integration_readiness_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpIntegrationReadinessGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-integration-readiness", guide)

    def test_help_evidence_graph_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpEvidenceGraphGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-evidence-graph", guide)

    def test_help_architecture_intelligence_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpArchitectureIntelligenceGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-architecture-intelligence", guide)

    def test_help_evidence_trail_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpEvidenceTrailGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-evidence-trail", guide)


if __name__ == "__main__":
    unittest.main()
