"""Static checks for admin operational posture script."""

from __future__ import annotations

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "report_admin_operational_posture.ps1"


def test_posture_script_masks_secret_like_values() -> None:
    text = SCRIPT.read_text(encoding="utf-8-sig")

    assert "Test-SecretLikeValue" in text
    assert "return '***'" in text
    assert "connectionstring" in text.lower()


def test_posture_script_references_proof_artifacts() -> None:
    text = SCRIPT.read_text(encoding="utf-8-sig")

    assert "config-lint-production-like-hosted-pilot.json" in text
    assert "data-consistency-summary.json" in text
    assert "admin-operational-posture.json" in text
