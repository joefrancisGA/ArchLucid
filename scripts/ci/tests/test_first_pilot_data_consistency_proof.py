"""Tests for data-consistency proof disposition helpers (PowerShell module contract)."""

from __future__ import annotations

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "collect-first-pilot-proof.ps1"
HELPER = REPO_ROOT / "scripts" / "FirstPilotDataConsistencyProof.ps1"


def test_data_consistency_helper_is_dot_sourced() -> None:
    text = SCRIPT.read_text(encoding="utf-8-sig")
    assert "FirstPilotDataConsistencyProof.ps1" in text
    assert "Resolve-DataConsistencyProofFinding" in text
    assert "dataConsistencyProof" in text


def test_hold_blocks_sponsor_handoff_in_helper() -> None:
    helper = HELPER.read_text(encoding="utf-8-sig")
    assert "disposition = 'BLOCK'" in helper
    assert "sponsorHandoffMustStop" in helper
    assert "data-consistency-summary.json" in helper


def test_collect_script_documents_summary_artifact_path() -> None:
    text = SCRIPT.read_text(encoding="utf-8-sig")
    assert "data-consistency-readiness/data-consistency-summary.json" in text
