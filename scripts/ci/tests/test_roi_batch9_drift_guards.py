"""Drift guards for architecture-quality ROI batch 9 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch9DriftGuards(unittest.TestCase):
    def test_compare_verdict_chrome_wires_gate_pack_and_execution_deltas(self) -> None:
        text = (
            _UI
            / "src/app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelVerdictChrome.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("CompareGateOutcomeDeltaPanel", text)
        self.assertIn("ComparePackAssignmentDeltaPanel", text)
        self.assertIn("CompareExecutionModeDeltaPanel", text)

    def test_first_review_guide_surfaces_roi_wk21_and_evidence_only(self) -> None:
        panel = (
            _UI / "src/app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuideSupportPanel.tsx"
        ).read_text(encoding="utf-8")
        setup = (
            _UI / "src/app/(operator)/architecture/first-review-guide/_sections/OptionalWorkspaceSetupList.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE", panel)
        self.assertIn("PolicyPackInfluenceHonestyChip", panel)
        self.assertIn("first-review-guide-evidence-only-fast-path", panel)
        self.assertIn("GOVERNANCE_POLICY_PACKS_PATH", setup)

    def test_inventory_zip_prompt_includes_evidence_only_fast_path(self) -> None:
        prompt = (_UI / "src/lib/first-review/azure-inventory-zip-first-review-prompt.ts").read_text(
            encoding="utf-8",
        )
        strip = (_UI / "src/components/reviews/FirstReviewAzureInventoryZipPromptStrip.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("FIRST_REVIEW_EVIDENCE_ONLY_FAST_PATH_LINE", prompt)
        self.assertIn("first-review-inventory-evidence-only-fast-path", strip)
        self.assertIn("EVIDENCE_ONLY_REVIEW_HELP_FAST_PATH_HREF", strip)

    def test_first_value_report_appends_sendable_cover(self) -> None:
        text = (_REPO / "ArchLucid.Application/Pilots/FirstValueReportBuilder.cs").read_text(encoding="utf-8")

        self.assertIn("SendableExportCoverComposer.AppendMarkdownSection", text)

    def test_sponsor_banner_and_operator_home_include_honesty(self) -> None:
        banner = (_UI / "src/components/EmailRunToSponsorBanner.tsx").read_text(encoding="utf-8")
        home = (_UI / "src/components/operator-home/OperatorHomeSponsorRoiStrip.tsx").read_text(encoding="utf-8")

        self.assertIn("SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE", banner)
        self.assertIn("PolicyPackInfluenceHonestyChip", banner)
        self.assertIn("operator-home-disposition-next-action", home)
        self.assertIn("PolicyPackInfluenceHonestyChip", home)


if __name__ == "__main__":
    unittest.main()
