"""Static alignment checks for authority vs coordinator integrator guidance."""

from __future__ import annotations

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


def _read(*parts: str) -> str:
    return (REPO_ROOT.joinpath(*parts)).read_text(encoding="utf-8")


def test_explain_operator_model_mentions_authority_pipeline_and_integrator_table() -> None:
    text = _read("ArchLucid.Cli", "Commands", "ExplainOperatorModelCommand.cs")

    assert "Authority pipeline" in text
    assert "Legacy coordinator" in text
    assert "Integrator decision table" in text
    assert "Do **not** call execute" in text


def test_evaluation_guide_does_not_require_coordinator_execute_after_create() -> None:
    text = _read("docs", "onboarding", "EVALUATION_GUIDE.md")

    assert "authority pipeline" in text
    assert "coordinator fills context snapshots and authority steps automatically" not in text


def test_api_contracts_contains_authority_vs_coordinator_section() -> None:
    text = _read("docs", "library", "API_CONTRACTS.md")

    assert "Authority pipeline vs coordinator" in text
    assert "idempotent" in text


def test_workflow_handoff_runbook_lists_v1_1_deferrals() -> None:
    text = _read("docs", "runbooks", "V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md")

    assert "Jira" in text
    assert "MCP" in text
    assert "CloudEvents" in text
    assert "fixtures/v1-workflow-handoff-github-comment.sample.md" in text
