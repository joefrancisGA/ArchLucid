"""Contract checks for data-consistency readiness operator guidance."""

from __future__ import annotations

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "collect-data-consistency-readiness.ps1"
GUIDANCE = REPO_ROOT / "scripts" / "DataConsistencyProbeGuidance.ps1"


def test_data_consistency_probe_guidance_is_sourced() -> None:
    text = SCRIPT.read_text(encoding="utf-8-sig")

    assert "DataConsistencyProbeGuidance.ps1" in text
    assert "sponsorHandoffMustStop" in text
    assert "Sponsor handoff stop" in text


def test_guidance_covers_core_probes() -> None:
    text = GUIDANCE.read_text(encoding="utf-8-sig")

    assert "/health/ready" in text
    assert "/health/diagnostics" in text
    assert "/v1/admin/diagnostics/data-consistency/orphans" in text
