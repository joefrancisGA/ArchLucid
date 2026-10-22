"""Contract tests for production-like Azure pilot proof reporter."""

from __future__ import annotations

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


def test_production_like_azure_pilot_proof_script_exists() -> None:
    path = REPO_ROOT / "scripts" / "ci" / "report_production_like_azure_pilot_proof.py"
    text = path.read_text(encoding="utf-8")
    assert "configured" in text.lower()
    assert "terraform" in text.lower()
    assert "not enabled" in text.lower() or "not-enabled" in text.lower()


def test_collect_proof_wires_azure_pilot_proof() -> None:
    text = (REPO_ROOT / "scripts" / "collect-first-pilot-proof.ps1").read_text(encoding="utf-8-sig")
    assert "report_production_like_azure_pilot_proof.py" in text
    assert "production-like-azure-pilot-proof.md" in text
