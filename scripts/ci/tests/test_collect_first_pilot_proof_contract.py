"""Static contract checks for first-pilot proof handoff behavior."""

from __future__ import annotations

import re
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "collect-first-pilot-proof.ps1"
DISPOSITION = REPO_ROOT / "scripts" / "FirstPilotProofDisposition.ps1"
TRIAGE_CARDS = REPO_ROOT / "docs" / "runbooks" / "FIRST_PILOT_TRIAGE_CARDS.md"
EVIDENCE_SCRIPT = REPO_ROOT / "scripts" / "collect-first-pilot-evidence.ps1"
DATA_CONSISTENCY_SCRIPT = REPO_ROOT / "scripts" / "collect-data-consistency-readiness.ps1"


def _script_text(path: Path = SCRIPT) -> str:
    return path.read_text(encoding="utf-8-sig")


def _registered_triage_ids() -> set[str]:
    text = TRIAGE_CARDS.read_text(encoding="utf-8")
    return set(re.findall(r"\|\s*(FP-T\d{3})\s*\|", text))


def _used_triage_ids(text: str) -> set[str]:
    return set(re.findall(r"-TriageCard\s+'(FP-T\d{3})'", text))


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
    assert "blockingReasons" in text
    assert "deferredScopeReasons" in text
    assert "dataConsistencyStatus" in text
    assert "roiBasisStatus" in text
    assert "roiSponsorSafe" in text
    assert "Resolve-SponsorPacketDisposition" in text
    disposition_text = DISPOSITION.read_text(encoding="utf-8-sig")
    assert "'READINESS_ONLY'" in disposition_text
    assert "'HOLD'" in text or "'HOLD'" in disposition_text
    assert "'SEND'" in text or "'SEND'" in disposition_text
    assert "'DEFERRED_SCOPE'" in disposition_text
    assert "## Sponsor Handoff Disposition" in text


def test_commercial_handoff_checks_are_wired() -> None:
    text = _script_text()

    assert "Add-DemoWorkspaceValidationFinding" in text
    assert "Add-ProductionLikeConfigLintFinding" in text
    assert "Write-QuoteToProofPacketMarkdown" in text
    assert "Add-RouteTierPolicyNavFinding" in text
    assert "Add-ProcurementDealReadyFinding" in text
    assert "Add-TrialToPaidTestModeEvidenceFinding" in text
    assert "Add-AcceleratorHandoffFinding" in text
    assert "Add-DemoDerivedRoiCommercialGate" in text
    assert "Add-PricingQuoteAgingFinding" in text
    assert "Add-RoiBasisLabelFinding" in text
    assert "Add-LlmCostSummaryFinding" in text
    assert "demo-workspace-validation.txt" in text
    assert "demo-workspace-validation.json" in text
    assert "quote-to-proof-packet.md" in text
    assert "config-lint-production-like-hosted-pilot.json" in text
    assert "config-lint-production-like-hosted-pilot.md" in text
    assert "route-tier-policy-nav-parity.md" in text
    assert "route-tier-policy-nav-parity.json" in text
    assert "procurement-deal-ready-check.txt" in text
    assert "procurement-deal-ready-summary.json" in text
    assert "trial-to-paid-test-mode-evidence.md" in text
    assert "accelerator-handoff-acceptance.md" in text


def test_workflow_handoff_runbook_has_sponsor_grade_command() -> None:
    runbook = (REPO_ROOT / "docs" / "runbooks" / "V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md").read_text(encoding="utf-8")

    assert "-SponsorHandoff" in runbook
    assert "quote-to-proof-packet.md" in runbook
    assert "Jira" in runbook and "V1.1" in runbook


def test_proof_summary_links_workflow_handoff_runbook() -> None:
    text = _script_text()

    assert "## Workflow handoff (optional)" in text
    assert "V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md" in text


def test_verify_demo_workspace_reports_pass_hold_disposition() -> None:
    script_path = REPO_ROOT / "scripts" / "verify-demo-workspace.ps1"
    text = script_path.read_text(encoding="utf-8-sig")

    assert "Demo workspace disposition:" in text
    assert "demo_preview_essentials.py" in text
    assert "JsonSummaryOut" in text
    assert "Fixture package:" in text
    assert "exit 2" in text


def test_production_like_hosted_pilot_blocks_route_tier_drift() -> None:
    text = _script_text()

    assert "if ($SponsorHandoff -or $ProductionLikeHostedPilot)" in text
    assert "Add-ProofFinding -Disposition 'BLOCK' -Name 'route-tier-policy-nav-parity'" in text


def test_route_tier_markdown_documents_api_authority_boundaries() -> None:
    script_path = REPO_ROOT / "scripts" / "ci" / "assert_route_tier_policy_nav.py"
    text = script_path.read_text(encoding="utf-8")

    assert "## Commercial and authority boundaries" in text
    assert "## Next action" in text
    assert "**402:**" in text
    assert "API route policies" in text
    assert "json-summary-out" in text


def test_proof_includes_api_hot_path_performance_artifact() -> None:
    text = _script_text()

    assert "[string] $K6SummaryPath" in text
    assert "report_api_hot_path_performance.py" in text
    assert "Add-ApiHotPathPerformanceFinding" in text
    assert "api-hot-path-performance.md" in text


def test_proof_includes_enterprise_operations_artifacts() -> None:
    text = _script_text()

    assert "[string] $StagingSmokeResultsPath" in text
    assert "[string] $HostedProbeArtifactsPath" in text
    assert "Add-FirstPilotPerformanceBaselineFinding" in text
    assert "Add-LlmBudgetStatusFinding" in text
    assert "Add-HostedAvailabilityRollupFinding" in text
    assert "Add-AzureExtractorUploadUxFinding" in text
    assert "Add-IdentityPreflightScenarioFinding" in text
    assert "Add-MutatingRouteAuditMatrixFinding" in text
    assert "Add-GovernancePolicyPackProofFinding" in text
    assert "first-pilot-performance-baseline.md" in text
    assert "llm-budget-proof-status.md" in text
    assert "hosted-availability-rollup.md" in text
    assert "identity-preflight-scenarios.md" in text
    assert "mutating-route-audit-matrix.md" in text
    assert "governance-policy-pack-dry-run-proof.md" in text


def test_evidence_collector_tracks_llm_budget_fields() -> None:
    text = _evidence_script_text()

    assert "llmBudgetStatus" in text
    assert "llmExecutionMode" in text
    assert "llm-budget-status.json" in text


def test_sponsor_handoff_preflight_uses_simulate_production() -> None:
    text = _script_text()

    assert "--simulate-production" in text
    assert "if ($ProductionLikeHostedPilot -or $SponsorHandoff)" in text


def test_disposition_module_is_sourced() -> None:
    text = _script_text()

    assert "FirstPilotProofDisposition.ps1" in text
    assert "Resolve-SponsorPacketDisposition" in text
    assert "Resolve-RoiBasisStatus" in text


def test_pilotstrict_observability_fields_are_collected() -> None:
    text = _evidence_script_text()

    assert "quality-gates" in text
    assert "qualityGateMode" in text
    assert "qualityGateEnforceOnReject" in text
    assert "qualityGateBlockRunOnReject" in text
    assert "pilotStrictMinAgentResultFaithfulnessSupportRatio" in text
    assert "unresolvedQualitySignalsPresent" in text


def _evidence_script_text() -> str:
    return EVIDENCE_SCRIPT.read_text(encoding="utf-8-sig")


def test_data_consistency_summary_json_is_emitted() -> None:
    text = DATA_CONSISTENCY_SCRIPT.read_text(encoding="utf-8-sig")

    assert "data-consistency-summary.json" in text
    assert "dataConsistencyStatus" in text
    assert "'NOT_RUN'" not in text
    assert "exit 2" in text


def test_triage_card_ids_resolve() -> None:
    script_text = _script_text()
    used = _used_triage_ids(script_text)
    registered = _registered_triage_ids()
    missing = sorted(used - registered)

    assert not missing, f"Unresolved triage card ids: {missing}"


def test_disposition_helpers_cover_send_hold_and_deferred_scope() -> None:
    text = DISPOSITION.read_text(encoding="utf-8-sig")

    assert "function Resolve-SponsorPacketDisposition" in text
    assert "return 'DEFERRED_SCOPE'" in text
    assert "function Test-RoiBasisSponsorSafe" in text
    assert "function Resolve-DataConsistencyStatusFromCollector" in text


def test_ai_quality_proof_is_wired() -> None:
    text = _script_text()
    ai_module = (REPO_ROOT / "scripts" / "FirstPilotAiQualityProof.ps1").read_text(encoding="utf-8-sig")

    assert "FirstPilotAiQualityProof.ps1" in text
    assert "Add-AiQualityProofFinding" in text
    assert "Add-RetrievalIrEvidenceFinding" in text
    assert "aiQualityProof" in text
    assert "## AI Quality Proof" in ai_module
    assert "function Build-AiQualityProofSnapshot" in ai_module
    assert "retrieval-ir-summary.json" in text


def test_evidence_collector_collects_retrieval_grounding() -> None:
    text = _evidence_script_text()

    assert "retrieval-grounding.json" in text
    assert "retrievalGroundingTracePresent" in text
    assert "citationCoverageMean" in text
    assert "support-summary.md" in text


def test_batch2_proof_flow_is_wired() -> None:
    text = _script_text()
    data_script = DATA_CONSISTENCY_SCRIPT.read_text(encoding="utf-8-sig")

    assert "[string] $LiveUiSqlResultPath" in text
    assert "Add-LiveUiSqlParityFinding" in text
    assert "Commercial disposition" in text
    assert "Recommended next ask" in text
    assert "Data consistency actions" in text
    assert "DataConsistencyProbeGuidance.ps1" in data_script
    assert "sponsorHandoffMustStop" in data_script
