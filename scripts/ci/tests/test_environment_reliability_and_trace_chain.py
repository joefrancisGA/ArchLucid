"""Contract tests for environment reliability rollup and trace chain summary."""

from __future__ import annotations

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


def test_environment_reliability_script_exists() -> None:
    path = REPO_ROOT / "scripts" / "report_environment_reliability_rollup.ps1"
    text = path.read_text(encoding="utf-8-sig")
    assert "environment-reliability-rollup.json" in text
    assert "ai-readiness-gate" in text


def test_trace_chain_script_exists() -> None:
    path = REPO_ROOT / "scripts" / "report_committed_review_trace_chain_summary.ps1"
    text = path.read_text(encoding="utf-8-sig")
    assert "committed-review-trace-chain-summary.json" in text
    assert "artifact-manifest.json" in text


def test_collect_proof_wires_rollups() -> None:
    text = (REPO_ROOT / "scripts" / "collect-first-pilot-proof.ps1").read_text(encoding="utf-8-sig")
    assert "Add-EnvironmentReliabilityRollupFinding" in text
    assert "Add-CommittedReviewTraceChainSummaryFinding" in text
    assert "environment-reliability-rollup.md" in text
    assert "committed-review-trace-chain-summary.md" in text
    assert "NEXT ACTION:" in text


def test_v1_navigation_index_builder_exists() -> None:
    path = REPO_ROOT / "scripts" / "ci" / "build_v1_navigation_index.py"
    assert path.is_file()
