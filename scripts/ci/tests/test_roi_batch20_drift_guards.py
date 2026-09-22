"""Drift guards for architecture-quality ROI batch 20 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch20DriftGuards(unittest.TestCase):
    def test_review_package_after_finalize_next_steps_export_honesty(self) -> None:
        strip = (
            _UI
            / "src/app/(operator)/architecture/reviews/[reviewId]/_sections/ReviewPackageAfterFinalizeNextStepsStrip.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", strip)
        self.assertIn("review-package-after-finalize-next-steps", strip)

    def test_help_teams_integration_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpTeamsIntegrationGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-teams-integration", guide)

    def test_help_search_review_evidence_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpSearchReviewEvidenceGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-search-review-evidence", guide)

    def test_help_structured_brief_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpStructuredBriefGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-structured-brief", guide)

    def test_help_governance_infrastructure_drift_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpGovernanceInfrastructureDriftGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-governance-infrastructure-drift", guide)

    def test_help_architecture_share_restrict_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpArchitectureShareRestrictGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-architecture-share-restrict", guide)


if __name__ == "__main__":
    unittest.main()
