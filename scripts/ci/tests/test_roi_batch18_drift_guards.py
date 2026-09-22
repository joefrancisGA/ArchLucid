"""Drift guards for architecture-quality ROI batch 18 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch18DriftGuards(unittest.TestCase):
    def test_run_detail_package_spine_export_honesty(self) -> None:
        strip = (
            _UI / "src/components/reviews/RunDetailPackageSpineExportCoLocationStrip.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", strip)
        self.assertIn("run-detail-package-spine-export", strip)

    def test_help_prior_manifest_retrieval_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpPriorManifestRetrievalGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-prior-manifest-retrieval", guide)

    def test_help_policy_pack_delta_demo_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpPolicyPackDeltaDemoGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-policy-pack-delta-demo", guide)

    def test_help_architecture_desk_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpArchitectureDeskGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-architecture-desk", guide)

    def test_help_career_rehearsal_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpCareerRehearsalGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-career-rehearsal", guide)

    def test_help_improvement_planning_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpImprovementPlanningGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-improvement-planning", guide)


if __name__ == "__main__":
    unittest.main()
