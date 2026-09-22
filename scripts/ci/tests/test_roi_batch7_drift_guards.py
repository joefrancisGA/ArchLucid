"""Drift guards for architecture-quality ROI batch 7 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch7DriftGuards(unittest.TestCase):
    def test_compare_results_panel_wires_treatment_band_delta(self) -> None:
        text = (
            _UI
            / "src/app/(operator)/insights/compare-two-reviews/_sections/CompareResultsPanelVerdictChrome.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("CompareTreatmentBandDeltaPanel", text)
        self.assertIn("treatmentView", text)

    def test_classification_chips_use_show_reason_on_working_surfaces(self) -> None:
        primary = (_UI / "src/components/findings/QuickDecisionWorkspacePrimaryFindingCard.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("FindingClassificationChip", primary)
        self.assertIn("showReason", primary)

    def test_spine_audit_export_surfaces_dual_channel_honesty(self) -> None:
        text = (_UI / "src/components/runs/RunScopedAuditExportButton.tsx").read_text(encoding="utf-8")

        self.assertIn("AuditDualChannelHonestyNote", text)
        self.assertIn("run-scoped-audit-export-dual-channel-honesty", text)

    def test_first_review_spine_surfaces_semantic_support_and_wk21(self) -> None:
        text = (_UI / "src/components/reviews/RunDetailFirstReviewSpineBand.tsx").read_text(encoding="utf-8")

        self.assertIn("run-detail-first-review-spine-semantic-support", text)
        self.assertIn("PolicyPackInfluenceHonestyChip", text)

    def test_emit_script_aliases_simulator_divergence_summary(self) -> None:
        text = (_REPO / "scripts" / "Emit-ReleaseReadinessEvidence.ps1").read_text(encoding="utf-8")

        self.assertIn("simulator-live-divergence-summary.json", text)

    def test_sendable_cover_includes_roi_non_summing_line(self) -> None:
        ui = (_UI / "src/lib/export-markdown-sendable-cover.ts").read_text(encoding="utf-8")
        server = (_REPO / "ArchLucid.Application/Exports/SendableExportCoverComposer.cs").read_text(
            encoding="utf-8",
        )

        self.assertIn("SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE", ui)
        self.assertIn("SponsorRoiNonSummingHeadlineLine", server)


if __name__ == "__main__":
    unittest.main()
