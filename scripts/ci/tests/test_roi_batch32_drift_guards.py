"""Drift guards for architecture-quality ROI batch 32 surfaces."""

from __future__ import annotations

import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_UI = _REPO / "archlucid-ui"


class TestRoiBatch32DriftGuards(unittest.TestCase):
    def test_evidence_graph_export_honesty(self) -> None:
        client = (
            _UI / "src/app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience.tsx"
        ).read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", client)
        self.assertIn("evidence-graph-export", client)
        self.assertIn("graph-png-export-disclaimer", client)

    def test_decision_receipt_export_honesty(self) -> None:
        button = (_UI / "src/components/draft-intake/DecisionReceiptExportButton.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorExportSendHonestyStrip", button)
        self.assertIn("decision-receipt-export", button)

    def test_manifest_detail_bundle_export_honesty(self) -> None:
        button = (_UI / "src/components/ManifestDetailBundleExportButton.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorExportSendHonestyStrip", button)
        self.assertIn("manifest-detail-bundle-export", button)

    def test_findings_itsm_export_honesty(self) -> None:
        toolbar = (_UI / "src/components/findings/FindingsItsmExportToolbar.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorExportSendHonestyStrip", toolbar)
        self.assertIn("findings-itsm-export", toolbar)
        self.assertIn("findings-export-csv-button", toolbar)
        self.assertIn("findings-export-json-button", toolbar)

    def test_consulting_docx_export_honesty(self) -> None:
        button = (_UI / "src/components/ConsultingDocxExportButton.tsx").read_text(encoding="utf-8")

        self.assertIn("SponsorExportSendHonestyStrip", button)
        self.assertIn("consulting-docx-export", button)
        self.assertIn("consulting-docx-export-button", button)

    def test_governance_findings_export_honesty(self) -> None:
        bar = (_UI / "src/components/governance/findings/GovernanceFindingsFilterBar.tsx").read_text(
            encoding="utf-8",
        )

        self.assertIn("SponsorExportSendHonestyStrip", bar)
        self.assertIn("governance-findings-export", bar)
        self.assertIn("governance-findings-export-json-button", bar)


if __name__ == "__main__":
    unittest.main()
