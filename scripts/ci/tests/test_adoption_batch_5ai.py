"""TB-215 wizard evidence upload drift guards (Batch 5AI)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AI(unittest.TestCase):
    def test_tb_215_evidence_upload_step_component(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "wizard" / "steps" / "WizardStepEvidenceUpload.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Add architecture evidence (optional)", text)
        self.assertIn("wizard-evidence-upload-skip-demo", text)

    def test_tb_215_upload_helper_supports_run_id(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "upload-azure-extractor-package.ts"
        text = path.read_text(encoding="utf-8")
        self.assertIn("azure-extractor/upload", text)
        self.assertIn("runId", text)

    def test_tb_215_new_run_wizard_wires_evidence_step(self) -> None:
        path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "architecture"
            / "reviews"
            / "new"
            / "NewRunWizardClient.tsx"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("WizardStepEvidenceUpload", text)
        self.assertIn("uploadPendingEvidence", text)
        self.assertIn("WizardPostCreateEvidenceUploadPanel", text)

    def test_tb_215_vitest_covers_evidence_upload_flow(self) -> None:
        path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "architecture"
            / "reviews"
            / "new"
            / "NewRunWizardClient.evidence-upload.test.tsx"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("wizard-evidence-upload-step", text)
        self.assertIn("uploadAzureExtractorPackage", text)

    def test_tb_215_wizard_step_fields_include_evidence_index(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "wizard-step-fields.ts"
        text = path.read_text(encoding="utf-8")
        self.assertIn("FULL_WIZARD_EVIDENCE_STEP_INDEX", text)


if __name__ == "__main__":
    unittest.main()
