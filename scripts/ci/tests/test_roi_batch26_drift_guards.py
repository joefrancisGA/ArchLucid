"""Drift guards for architecture-quality ROI batch 26 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch26DriftGuards(unittest.TestCase):
    def test_audit_evidence_package_export_honesty(self) -> None:
        client = (
            _UI
            / "src/app/(operator)/governance/audit-evidence/[assessmentId]/snapshots/[snapshotId]/controls/[controlId]/AuditEvidenceControlLineageClient.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", client)
        self.assertIn("audit-evidence-package", client)

    def test_help_sketch_a_change_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpSketchAChangeGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-sketch-a-change", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_impact_preview_vs_envelope_send_path_honesty(self) -> None:
        guide = (
            _UI
            / "src/app/(operator)/help/_sections/HelpImpactPreviewVsArchitectureEnvelopeGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-impact-preview-vs-envelope", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_extraction_fidelity_ln034_extraction_rules(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpExtractionFidelityGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertNotIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-extraction-fidelity", guide)
        self.assertIn("help-extraction-fidelity-extraction-rules", guide)
        self.assertIn("LIVELIHOOD_GRADE_NO_EXTRACTION_PROVENANCE_ROWS", guide)

    def test_help_false_hard_infeasibility_send_path_honesty(self) -> None:
        guide = (
            _UI / "src/app/(operator)/help/_sections/HelpFalseHardInfeasibilityGuideView.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-false-hard-infeasibility", guide)
        self.assertIn("showSsoOptional={false}", guide)

    def test_help_standards_rules_send_path_honesty(self) -> None:
        guide = (_UI / "src/app/(operator)/help/_sections/HelpStandardsRulesGuideView.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorSendPathHonestyPanel", guide)
        self.assertIn("help-standards-rules", guide)
        self.assertIn("showSsoOptional={false}", guide)


if __name__ == "__main__":
    unittest.main()
