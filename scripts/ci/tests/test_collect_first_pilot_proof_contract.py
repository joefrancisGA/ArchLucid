"""Static contract checks for first-pilot proof handoff behavior."""

from __future__ import annotations

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "collect-first-pilot-proof.ps1"


def _script_text() -> str:
    return SCRIPT.read_text(encoding="utf-8-sig")


def test_sponsor_handoff_missing_runid_blocks() -> None:
    text = _script_text()

    assert "[switch] $SponsorHandoff" in text
    assert "No RunId supplied; committed-review evidence collection was skipped in sponsor handoff mode." in text
    assert "Add-ProofFinding -Disposition 'BLOCK' -Name 'committed-run-evidence'" in text


def test_production_like_handoff_blocks_missing_telemetry_export() -> None:
    text = _script_text()

    assert "[switch] $ProductionLikeHostedPilot" in text
    assert "report_observability_export_readiness.py" in text
    assert "$telemetryArgs += '--strict-exit-code'" in text
    assert "Add-ProofFinding -Disposition 'BLOCK' -Name 'telemetry-export-readiness'" in text


def test_summary_includes_sponsor_packet_disposition() -> None:
    text = _script_text()

    assert "sponsorPacketDisposition" in text
    assert "'READINESS_ONLY'" in text
    assert "'HOLD'" in text
    assert "'SEND'" in text


def test_commercial_handoff_checks_are_wired() -> None:
    text = _script_text()

    assert "Add-RouteTierPolicyNavFinding" in text
    assert "Add-ProcurementDealReadyFinding" in text
    assert "Add-PricingQuoteAgingFinding" in text
    assert "Add-RoiBasisLabelFinding" in text
    assert "Add-LlmCostSummaryFinding" in text
    assert "route-tier-policy-nav-parity.md" in text
    assert "procurement-deal-ready-check.txt" in text


def test_proof_includes_api_hot_path_performance_artifact() -> None:
    text = _script_text()

    assert "[string] $K6SummaryPath" in text
    assert "report_api_hot_path_performance.py" in text
    assert "Add-ApiHotPathPerformanceFinding" in text
    assert "api-hot-path-performance.md" in text


def test_sponsor_handoff_preflight_uses_simulate_production() -> None:
    text = _script_text()

    assert "--simulate-production" in text
    assert "if ($ProductionLikeHostedPilot -or $SponsorHandoff)" in text
