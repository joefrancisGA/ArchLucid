"""Contract tests for commercial next-step recommendation script."""

from __future__ import annotations

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


def test_commercial_next_step_script_exists() -> None:
    path = REPO_ROOT / "scripts" / "FirstPilotCommercialNextStep.ps1"
    text = path.read_text(encoding="utf-8-sig")
    assert "Resolve-CommercialNextStepRecommendation" in text
    assert "Deferred buyer requirement" in text
    assert "ARB Report" in text


def test_collect_proof_wires_commercial_and_workflow() -> None:
    text = (REPO_ROOT / "scripts" / "collect-first-pilot-proof.ps1").read_text(encoding="utf-8-sig")
    assert "FirstPilotCommercialNextStep.ps1" in text
    assert "FirstPilotWorkflowHandoff.ps1" in text
    assert "commercial-next-step.json" in text
    assert "v1-workflow-handoff-comment.md" in text
    assert "Write-V1WorkflowHandoffArtifacts" in text
