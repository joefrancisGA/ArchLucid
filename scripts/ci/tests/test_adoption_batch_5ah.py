"""TB-220 wizard-to-commit OTel histogram drift guards (Batch 5AH)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


def _instrumentation_sources() -> str:
    diagnostics = REPO_ROOT / "ArchLucid.Core" / "Diagnostics"
    return "".join(
        path.read_text(encoding="utf-8")
        for path in sorted(diagnostics.glob("ArchLucidInstrumentation*.cs"))
    )


class TestAdoptionBatch5AH(unittest.TestCase):
    def test_tb_220_architecture_request_has_request_source(self) -> None:
        path = REPO_ROOT / "ArchLucid.Contracts" / "Requests" / "ArchitectureRequest.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("RequestSource", text)
        self.assertIn("WizardPresetUsed", text)

    def test_tb_220_instrumentation_histogram(self) -> None:
        text = _instrumentation_sources()
        self.assertIn("archlucid.pilot.wizard_to_committed_minutes", text)
        self.assertIn("RecordWizardToCommittedMinutes", text)

    def test_tb_220_commit_orchestrator_records_telemetry(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Application"
            / "Runs"
            / "Orchestration"
            / "AuthorityDrivenArchitectureRunCommitOrchestrator.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("WizardPilotCommitTelemetry.RecordIfWizardSourced", text)

    def test_tb_220_wizard_payload_sends_request_source(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "wizard-payload.ts"
        text = path.read_text(encoding="utf-8")
        self.assertIn('requestSource?: "wizard"', text)
        self.assertIn("payload.requestSource = options.requestSource", text)
        self.assertIn("wizardPresetUsed", text)

    def test_tb_220_observability_doc_lists_histogram(self) -> None:
        path = REPO_ROOT / "docs" / "library" / "OBSERVABILITY.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("archlucid.pilot.wizard_to_committed_minutes", text)

    def test_tb_220_pilot_scorecard_operational_metric(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "PILOT_SUCCESS_SCORECARD.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Wizard-to-finalize wall-clock", text)
        self.assertIn("archlucid.pilot.wizard_to_committed_minutes", text)


if __name__ == "__main__":
    unittest.main()
