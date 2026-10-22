"""Move ArchLucidInstrumentation instrument fields into subsystem partials."""

from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DIAG = REPO_ROOT / "ArchLucid.Core" / "Diagnostics"
MAIN = DIAG / "ArchLucidInstrumentation.cs"

INSTRUMENT_PARTIAL_MAP: dict[str, list[str]] = {
    "ArchLucidInstrumentation.Agent.cs": [
        "AgentExecuteTaskSkippedIdempotentTotal",
        "AgentExecutionStagedCriticPhaseDurationMilliseconds",
        "AgentFaithfulnessCosine",
        "AgentHandlerDegradationsTotal",
        "AgentHandlerInvocationsTotal",
        "AgentOutputEmbeddingFaithfulnessMeanCosine",
        "AgentOutputJudgeDisagreement",
        "AgentOutputLlmFaithfulnessScore",
        "AgentOutputParseFailuresTotal",
        "AgentOutputQualityGateTotal",
        "AgentOutputReferenceCaseEvaluationsTotal",
        "AgentOutputReferenceCaseScoreRatio",
        "AgentOutputSemanticScore",
        "AgentOutputStructuralCompletenessRatio",
        "AgentTraceBlobPersistDurationMs",
        "AgentTraceBlobUploadFailuresTotal",
        "AgentTracePromptInlineFallbacksTotal",
        "EvidenceInjectionFieldsRedactedTotal",
        "ExplanationAggregateFaithfulnessFallbacksTotal",
        "ExplanationCitationsEmitted",
        "ExplanationFaithfulnessRatio",
        "ExplanationRetrySuccessTotal",
        "ExplanationSchemaValidationsTotal",
    ],
    "ArchLucidInstrumentation.Audit.cs": [
        "AuditRetryEnqueueDroppedTotal",
        "AuditWriteFailuresTotal",
        "RequiredAuditTrailOrphanAlertsTotal",
        "RequiredAuditTrailOrphansDetectedTotal",
        "RequiredAuditWriteAbandonsTotal",
    ],
    "ArchLucidInstrumentation.Caches.cs": [
        "DemoPreviewCacheHits",
        "DemoPreviewCacheMisses",
        "ExplanationCacheHits",
        "ExplanationCacheMisses",
        "GovernancePackContentDeserializeCacheHits",
        "GovernancePackContentDeserializeCacheMisses",
        "HotPathReadCacheInFlightDedupedTotal",
        "LlmCompletionCacheHitsTotal",
        "LlmCompletionCacheMissesTotal",
        "LlmCompletionCachePoisonBustsTotal",
    ],
    "ArchLucidInstrumentation.GrowthFunnel.cs": [
        "BaselineManualPrepCapturedTotal",
        "CorePilotRailChecklistStepsTotal",
        "EmailOtpChallengeRequestedTotal",
        "EmailOtpChallengeVerifiedTotal",
        "EmailOtpDeliveryFailedTotal",
        "EmailOtpRateLimitTriggeredTotal",
        "FirstSessionCompletedTotal",
        "FirstTenantFunnelEventsTotal",
        "OperatorTaskSuccessTotal",
        "PricingQuoteRequestAgeHours",
        "SelfServiceTrialAbuseDeniedTotal",
        "SignupMarketingConversionTotal",
        "SponsorBannerFirstCommitBadgeRenderedTotal",
        "TeamExpansionNudgeClickedTotal",
        "TeamExpansionNudgeShownTotal",
        "TenantTimeToFirstCommitSeconds",
        "TrialConversionTotal",
        "TrialExpirationsTotal",
        "TrialFirstRunSeconds",
        "TrialFunnelHealthProbeTotal",
        "TrialRegistrationFailuresTotal",
        "TrialRunsUsedRatio",
        "TrialSignupBaselineSkippedTotal",
        "TrialSignupFailuresTotal",
        "TrialSignupsTotal",
        "TrialUpgradeNudgeClickedTotal",
        "TrialUpgradeNudgeShownTotal",
        "WizardToCommittedMinutes",
    ],
    "ArchLucidInstrumentation.Integration.cs": [
        "DigestDeliveryFailed",
        "DigestDeliverySucceeded",
        "IntegrationEventDeliveryFailedTotal",
        "IntegrationEventDeliverySuccessTotal",
        "IntegrationEventDlqPermanentFailureTotal",
        "PostCommitProjectionOutboxDeadLetteredTotal",
        "PostCommitProjectionOutboxProcessedSuccessTotal",
        "PostCommitProjectionOutboxRetryScheduledTotal",
        "RunExportBlobPushOutboxDeadLetteredTotal",
        "RunExportBlobPushOutboxProcessedSuccessTotal",
        "RunExportBlobPushOutboxRetryScheduledTotal",
        "WebhookDeliveries",
        "WebhookDeliveryDurationMilliseconds",
    ],
    "ArchLucidInstrumentation.Llm.cs": [
        "CircuitBreakerProbeOutcomes",
        "CircuitBreakerRejections",
        "CircuitBreakerStateTransitions",
        "LlmBatchEstimatedSavingsUsdTotal",
        "LlmBatchJobsCompletedTotal",
        "LlmCachedPromptTokensTotal",
        "LlmCallRetries",
        "LlmCallsPerRun",
        "LlmCompletionFallbackEngagementsTotal",
        "LlmCompletionTokensDimensional",
        "LlmCompletionTokensTotal",
        "LlmContentSafetyBlockedTotal",
        "LlmCostUsdTotal",
        "LlmEmbeddingInputTokensTotal",
        "LlmGenAiOperationDurationMilliseconds",
        "LlmJudgeBudgetExhaustedTotal",
        "LlmMonthlyBudgetAdmissionBlockedTotal",
        "LlmMonthlyBudgetOptimisticRetryExhaustedTotal",
        "LlmMonthlyBudgetPeriodRemapTotal",
        "LlmMonthlyBudgetReservationReclaimedTotal",
        "LlmPromptRedactionsTotal",
        "LlmPromptRedactionSkippedTotal",
        "LlmPromptTokensTotal",
        "LlmQuotaExceededTotal",
        "LlmRateLimitTotal",
    ],
    "ArchLucidInstrumentation.LlmWallet.cs": [
        "LlmWalletRefillFailuresTotal",
        "LlmWalletRefillUsdTotal",
    ],
    "ArchLucidInstrumentation.Operations.cs": [
        "AlertEvaluationDurationMilliseconds",
        "BillingCheckoutsTotal",
        "ContainerJobRunDurationMilliseconds",
        "ContainerJobRunsTotal",
        "DataArchivalBlobsDeletedTotal",
        "DataConsistencyAlerts",
        "DataConsistencyHeaderRepointsDetected",
        "DataConsistencyOrphansDetected",
        "DataConsistencyOrphansQuarantined",
        "DataConsistencyReconciliationDurationMilliseconds",
        "DataConsistencyReconciliationFindingsTotal",
        "SponsorRoiBackgroundScopeViolationsTotal",
        "ExplainabilityTraceCompleteness",
        "GovernanceResolveDurationMilliseconds",
        "ProvenanceSnapshotReadHitsTotal",
        "ProvenanceSnapshotRebuildFallbackTotal",
        "ProvenanceSnapshotWritesTotal",
        "QueryNamedLatencyMilliseconds",
        "StartupConfigWarningsTotal",
        "WorkerDrainForcedKillTotal",
        "WorkerDrainLeaseReleaseDurationMilliseconds",
        "WorkerDrainStartedTotal",
    ],
    "ArchLucidInstrumentation.Retrieval.cs": [
        "AzureRetailPricesHeuristicFallbackTotal",
        "GraphRagExpansionLatencyMilliseconds",
        "GraphRagNeighborsAddedTotal",
        "ProvenanceCompleteness",
        "RagChunksRetrieved",
        "RagRetrievalDurationMilliseconds",
        "RagRetrievalFallbackTotal",
        "RetrievalCorpusStartupIndexerFailureTotal",
        "RetrievalEmbeddingDimensionMismatchTotal",
        "RetrievalFaithfulnessRatio",
        "RetrievalIndexChunkingFingerprintInvalidatedTotal",
        "RetrievalIndexDocumentReindexedTotal",
        "RetrievalIndexDocumentSkippedUnchangedTotal",
        "RetrievalRerankLatencyMilliseconds",
    ],
    "ArchLucidInstrumentation.Runs.cs": [
        "AgentResultSchemaValidationsTotal",
        "AgentSchemaRemediationCompletionsTotal",
        "AgentSchemaRemediationRetriesTotal",
        "AuthorityPipelineStageDurationMilliseconds",
        "AuthorityPipelineStageSkippedCheckpointTotal",
        "AuthorityRunsCompletedTotal",
        "FindingEngineFailuresTotal",
        "FindingsEnginePartialFailureTotal",
        "FindingsProducedTotal",
        "OrchestratorTransitionTotal",
        "PipelineTimeoutsTotal",
        "RunsCostPreviewViewedTotal",
        "RunsCreatedTotal",
        "TryRealModeAttemptedTotal",
        "TryRealModeFellBackToSimulatorTotal",
        "TryRealModeSucceededTotal",
    ],
}

FIELD_TO_PARTIAL = {
    field: partial for partial, fields in INSTRUMENT_PARTIAL_MAP.items() for field in fields
}

INSTRUMENT_RE = re.compile(
    r"public static readonly (?:Counter|Histogram|UpDownCounter)<[^>]+> (\w+)",
    re.MULTILINE,
)
CLASS_OPEN_RE = re.compile(r"(public static partial class ArchLucidInstrumentation\s*\{)")


def find_statement_end(text: str, start: int) -> int:
    depth_paren = 0
    depth_angle = 0
    in_string = False
    escape = False

    for index in range(start, len(text)):
        char = text[index]

        if in_string:
            if escape:
                escape = False
                continue

            if char == "\\":
                escape = True
                continue

            if char == '"':
                in_string = False

            continue

        if char == '"':
            in_string = True
            continue

        if char == "(":
            depth_paren += 1
        elif char == ")":
            depth_paren -= 1
        elif char == "<":
            depth_angle += 1
        elif char == ">":
            depth_angle = max(0, depth_angle - 1)
        elif char == ";" and depth_paren == 0 and depth_angle == 0:
            return index + 1

    return len(text)


def find_block_start(text: str, decl_start: int) -> int:
    line_start = text.rfind("\n", 0, decl_start) + 1
    cursor = line_start

    while cursor > 0:
        prev_newline = text.rfind("\n", 0, cursor - 1)
        prev_line = text[prev_newline + 1 : cursor]

        if prev_line.strip() == "":
            cursor = prev_newline + 1
            continue

        if prev_line.lstrip().startswith("///"):
            cursor = prev_newline + 1
            continue

        break

    return cursor


def extract_instruments(text: str) -> tuple[str, dict[str, str]]:
    blocks: dict[str, str] = {}
    removals: list[tuple[int, int]] = []

    for match in INSTRUMENT_RE.finditer(text):
        name = match.group(1)
        block_start = find_block_start(text, match.start())
        block_end = find_statement_end(text, match.start())
        blocks[name] = text[block_start:block_end].rstrip() + "\n"
        removals.append((block_start, block_end))

    new_text = text
    for start, end in sorted(removals, reverse=True):
        new_text = new_text[:start] + new_text[end:]

    new_text = re.sub(r"\n{3,}", "\n\n", new_text)
    return new_text, blocks


def ensure_metrics_using(content: str) -> str:
    if "using System.Diagnostics.Metrics;" in content:
        return content

    lines = content.splitlines(keepends=True)
    insert_at = 0

    for index, line in enumerate(lines):
        if line.startswith("using "):
            insert_at = index + 1

    lines.insert(insert_at, "using System.Diagnostics.Metrics;\n")
    return "".join(lines)


def inject_instruments(partial_path: Path, instrument_blocks: list[str]) -> None:
    content = partial_path.read_text(encoding="utf-8")
    content = ensure_metrics_using(content)
    content = content.replace(
        "Instrument field declarations remain in <c>ArchLucidInstrumentation.cs</c>.",
        "Instrument field declarations for this subsystem live in this partial.",
    )

    section = "\n    // Instrument catalog\n" + "".join(f"\n    {block.rstrip()}\n" for block in instrument_blocks)
    content = CLASS_OPEN_RE.sub(r"\1" + section, content, count=1)
    partial_path.write_text(content, encoding="utf-8")


def main() -> None:
    text = MAIN.read_text(encoding="utf-8")
    new_main, blocks = extract_instruments(text)

    mapped = set(FIELD_TO_PARTIAL)
    found = set(blocks)

    missing = mapped - found
    extra = found - mapped

    if missing:
        raise SystemExit(f"Missing instruments in main file: {sorted(missing)}")

    if extra:
        raise SystemExit(f"Unmapped instruments in main file: {sorted(extra)}")

    new_main = new_main.replace(
        "This file owns the shared meter, activity-source aliases, and the instrument catalog (counters/histograms).\n"
        "     Recording helpers and observable-gauge registration live in subsystem partials:",
        "This file owns the shared meter and activity-source aliases.\n"
        "     Instrument catalogs, recording helpers, and observable-gauge registration live in subsystem partials:",
    )

    MAIN.write_text(new_main, encoding="utf-8")

    for partial_name, field_names in INSTRUMENT_PARTIAL_MAP.items():
        partial_path = DIAG / partial_name
        ordered_blocks = [blocks[name] for name in field_names]
        inject_instruments(partial_path, ordered_blocks)
        print(f"updated {partial_name} (+{len(field_names)} instruments)")

    print(f"trimmed {MAIN.name} ({len(blocks)} instruments moved)")


if __name__ == "__main__":
    main()
