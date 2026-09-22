"""Drift guards for architecture-quality ROI batch 8 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch8DriftGuards(unittest.TestCase):
    def test_compare_results_panel_wires_roi_headline_delta(self) -> None:
        text = (
            _UI
            / "src/app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelVerdictChrome.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("CompareRoiHeadlineDeltaPanel", text)
        self.assertIn("roiHeadlineDeltaState", text)

    def test_first_review_spine_surfaces_treatment_and_disposition(self) -> None:
        band = (_UI / "src/lib/reviews/first-review-spine-band.ts").read_text(encoding="utf-8")
        spine = (_UI / "src/components/reviews/RunDetailFirstReviewSpineBand.tsx").read_text(encoding="utf-8")

        self.assertIn("treatmentSummaryLine", band)
        self.assertIn("openDecisionGradeDispositionCount", band)
        self.assertIn("run-detail-first-review-spine-treatment", spine)
        self.assertIn("run-detail-first-review-spine-disposition-next-action", spine)

    def test_board_pack_builder_includes_roi_and_wk21_honesty(self) -> None:
        text = (_REPO / "ArchLucid.Application/Roi/SponsorRoiBoardPackMarkdownBuilder.cs").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorRoiNonSummingHeadlineLine", text)
        self.assertIn("PolicyPackInfluenceHonestyLine", text)

    def test_operator_home_roi_strip_includes_non_summing_line(self) -> None:
        text = (_UI / "src/components/operator-home/OperatorHomeSponsorRoiStrip.tsx").read_text(encoding="utf-8")

        self.assertIn("SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE", text)

    def test_inventory_zip_prompt_lists_multicloud_scripts(self) -> None:
        prompt = (_UI / "src/lib/first-review/azure-inventory-zip-first-review-prompt.ts").read_text(
            encoding="utf-8",
        )
        strip = (_UI / "src/components/reviews/FirstReviewAzureInventoryZipPromptStrip.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("Get-ArchLucidAwsPackage.ps1", prompt)
        self.assertIn("Get-ArchLucidGcpPackage.ps1", prompt)
        self.assertIn("first-review-inventory-zip-multicloud-scripts", strip)

    def test_faithfulness_warn_only_stamp_in_rc_index(self) -> None:
        text = (_REPO / "scripts/ci/build_rc_evidence_index.py").read_text(encoding="utf-8")

        self.assertIn("_faithfulness_warn_only_verdict", text)
        self.assertIn("enforce flip still owner", text)


if __name__ == "__main__":
    unittest.main()
