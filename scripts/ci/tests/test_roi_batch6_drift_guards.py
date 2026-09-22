"""Drift guards for architecture-quality ROI batch 6 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch6DriftGuards(unittest.TestCase):
    def test_compare_results_panel_wires_classification_and_semantic_band_deltas(self) -> None:
        text = (
            _UI
            / "src/app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelVerdictChrome.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("CompareClassificationBandDeltaPanel", text)
        self.assertIn("CompareSemanticSupportBandDeltaPanel", text)
        self.assertIn("classificationView", text)

    def test_inspect_surfaces_use_show_reason(self) -> None:
        header = (
            _UI
            / "src/app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/_sections/FindingDetailHeader.tsx"
        ).read_text(encoding="utf-8")
        section = (_UI / "src/components/findings/FindingSemanticSupportBandInspectSection.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("showReason", header)
        self.assertIn("showReason", section)

    def test_semantic_support_desk_inventory_includes_governance_queue(self) -> None:
        text = (_UI / "src/lib/findings/semantic-support-band-desk-inventory.ts").read_text(encoding="utf-8")

        self.assertIn("GovernanceFindingsQueueOperationalRowCells.tsx", text)

    def test_stamp_summary_surfaces_lane_b_honesty_when_unchecked(self) -> None:
        text = (
            _UI
            / "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailReviewPackageSemanticSupportBandSummary.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("run-detail-stamp-semantic-support-lane-b-honesty", text)
        self.assertIn("SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY", text)

    def test_secondary_and_summary_cards_surface_typed_engine_honesty(self) -> None:
        secondary = (_UI / "src/components/findings/QuickDecisionWorkspaceSecondaryFindingCard.tsx").read_text(
            encoding="utf-8",
        )
        summary = (_UI / "src/components/quick-decision-summary/QuickDecisionSummaryFindingRow.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE", secondary)
        self.assertIn("INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE", summary)


if __name__ == "__main__":
    unittest.main()
