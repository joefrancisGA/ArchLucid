"""Drift guards for architecture-quality ROI batch 16 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch16DriftGuards(unittest.TestCase):
    def test_manifest_deliverable_grid_export_honesty(self) -> None:
        grid = (_UI / "src/components/ManifestDeliverableGrid.tsx").read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", grid)
        self.assertIn("manifest-deliverable", grid)
        self.assertIn("SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE", grid)
        self.assertIn("POLICY_PACK_INFLUENCE_HONESTY_LINE", grid)

    def test_help_digests_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpDigestsGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-digests", guide)

    def test_help_first_value_20_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpFirstValue20GuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-first-value-20", guide)

    def test_help_policy_packs_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpPolicyPacksGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-policy-packs", guide)

    def test_help_impact_preview_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpImpactPreviewGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-impact-preview", guide)

    def test_help_governance_approval_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpGovernanceApprovalGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-governance-approval", guide)


if __name__ == "__main__":
    unittest.main()
