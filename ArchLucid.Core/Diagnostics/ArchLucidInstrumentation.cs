using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Shared <see cref="ActivitySource" /> and <see cref="Meter" /> names for cross-cutting observability (OTel wiring in
///     the API host).
/// </summary>
/// <remarks>
///     This file owns the shared meter, activity-source aliases, and the instrument catalog (counters/histograms).
///     Recording helpers and observable-gauge registration live in subsystem partials:
///     <c>ArchLucidInstrumentation.{Subsystem}.cs</c> (Agent, Audit, Caches, GrowthFunnel, Integration, Llm,
///     LlmWallet, ObservableGauges, Operations, Retrieval, Runs).
/// </remarks>
public static partial class ArchLucidInstrumentation
{
    /// <summary>Maximum characters for optional GenAI span payloads gated by <c>LlmTelemetry:CapturePromptResponseOnSpans</c>.</summary>
    public const int SensitiveGenAiTelemetrySnapshotMaxChars = 65536;

    /// <summary>Meter name registered with OpenTelemetry in <c>AddArchLucidOpenTelemetry</c>.</summary>
    public static string MeterName => ArchLucidMeterNames.Meter;

    private static readonly Meter AppMeter = new(MeterName, "1.0.0");

    /// <summary>Root span name for <see cref="AuthorityRun" /> (matches <c>authority.*</c> stage naming for trace sampling).</summary>
    public const string AuthorityRunRootActivityName = "authority.run";

    /// <summary>Scheduled advisory scan pipeline (<c>AdvisoryScanRunner</c>).</summary>
    public static ActivitySource AdvisoryScan => ArchLucidActivitySources.AdvisoryScan;

    /// <summary>Authority run orchestration (ingestion → manifest).</summary>
    public static ActivitySource AuthorityRun => ArchLucidActivitySources.AuthorityRun;

    /// <summary>Post-commit retrieval indexing of committed runs.</summary>
    public static ActivitySource RetrievalIndex => ArchLucidActivitySources.RetrievalIndex;

    /// <summary>One span per production agent handler invocation (<c>RealAgentExecutor</c>).</summary>
    public static ActivitySource AgentHandler => ArchLucidActivitySources.AgentHandler;

    /// <summary>Staged batch phases in <c>RealAgentExecutor</c> (e.g. Phase 1 vs Critic).</summary>
    public static ActivitySource AgentExecution => ArchLucidActivitySources.AgentExecution;

    /// <summary>Azure OpenAI chat completion calls (nested under agent handler when a trace is active).</summary>
    public static ActivitySource AgentLlmCompletion => ArchLucidActivitySources.AgentLlmCompletion;

    /// <summary>Azure OpenAI text-embedding RPCs (retrieval indexer / evidence embeddings).</summary>
    public static ActivitySource AgentLlmEmbedding => ArchLucidActivitySources.AgentLlmEmbedding;

    /// <summary>Retrieval indexing outbox batch processor (<c>RetrievalIndexingOutboxProcessor</c>).</summary>
    public static ActivitySource RetrievalIndexingOutbox => ArchLucidActivitySources.RetrievalIndexingOutbox;

    /// <summary>Integration event Service Bus publish outbox (<c>IntegrationEventOutboxProcessor</c>).</summary>
    public static ActivitySource IntegrationEventOutbox => ArchLucidActivitySources.IntegrationEventOutbox;

    /// <summary>Scheduled data retention archival (<c>DataArchivalCoordinator</c>).</summary>
    public static ActivitySource DataArchival => ArchLucidActivitySources.DataArchival;

    /// <summary>Orphaned agent-trace blobs deleted by archival cleanup.</summary>
    public static readonly Counter<long> DataArchivalBlobsDeletedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_data_archival_blobs_deleted_total",
            description: "Agent trace blobs deleted because the authority run no longer exists.");

    /// <summary>Evidence ZIP expansion (<c>ZipEvidenceExpanderService</c>).</summary>
    public static ActivitySource EvidenceZipExpansion => ArchLucidActivitySources.EvidenceZipExpansion;

    /// <summary>Azure extractor package upload ingest (<c>AzureExtractorIngestService</c>).</summary>
    public static ActivitySource AzureExtractorUpload => ArchLucidActivitySources.AzureExtractorUpload;

    /// <summary>AWS/GCP inventory package upload ingest (<c>CloudInventoryExtractorIngestService</c>).</summary>
    public static ActivitySource CloudInventoryExtractorUpload =>
        ArchLucidActivitySources.CloudInventoryExtractorUpload;

    /// <summary>Digest channel send succeeded (labels: <c>channel</c>).</summary>
    public static readonly Counter<long> DigestDeliverySucceeded =
        AppMeter.CreateCounter<long>("archlucid_digest_delivery_succeeded");

    /// <summary>Digest channel send failed after non-cancellation error (labels: <c>channel</c>).</summary>
    public static readonly Counter<long> DigestDeliveryFailed = AppMeter.CreateCounter<long>("archlucid_digest_delivery_failed");

    /// <summary>
    ///     Outbound HTTP webhook POST attempts (<c>IWebhookPoster</c>; labels <c>event_type</c>, <c>succeeded</c>=true|false).
    /// </summary>
    public static readonly Counter<long> WebhookDeliveries =
        AppMeter.CreateCounter<long>(
            "archlucid.webhook.deliveries",
            description:
            "Webhook HTTP deliveries (labels event_type low-cardinality literal, succeeded=true|false).");

    /// <summary>Wall-clock HTTP POST latency for webhook deliveries (ms; label <c>event_type</c>).</summary>
    public static readonly Histogram<double> WebhookDeliveryDurationMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid.webhook.delivery_duration",
            "ms",
            "Outbound webhook HTTP POST attempt duration.");

    /// <summary>
    ///     Wall time for <c>EvaluateAndPersistAsync</c> (labels: <c>rule_kind</c> = <c>simple</c> | <c>composite</c>).
    /// </summary>
    public static readonly Histogram<double> AlertEvaluationDurationMilliseconds = AppMeter.CreateHistogram<double>(
        "archlucid_alert_evaluation_duration_ms",
        "ms",
        "Time spent in alert EvaluateAndPersistAsync per rule kind.");

    /// <summary>Wall time for effective governance resolution (<c>IEffectiveGovernanceResolver.ResolveAsync</c>).</summary>
    public static readonly Histogram<double> GovernanceResolveDurationMilliseconds = AppMeter.CreateHistogram<double>(
        "archlucid_governance_resolve_duration_ms",
        "ms",
        "Time to resolve effective governance for a tenant/workspace/project scope.");

    /// <summary>
    ///     Per advisory scan: fraction of explainability trace fields populated across findings (0.0–1.0; label
    ///     <c>scan_type</c>).
    /// </summary>
    public static readonly Histogram<double> ExplainabilityTraceCompleteness = AppMeter.CreateHistogram<double>(
        "archlucid_explainability_trace_completeness_ratio",
        description: "Per-scan trace completeness ratio (0.0–1.0).");

    /// <summary>
    ///     Heuristic overlap between aggregate explanation tokens and flattened finding <c>ExplainabilityTrace</c> text
    ///     (0.0–1.0).
    /// </summary>
    public static readonly Histogram<double> ExplanationFaithfulnessRatio = AppMeter.CreateHistogram<double>(
        "archlucid_explanation_faithfulness_ratio",
        description: "Heuristic faithfulness of run explanation vs finding traces (0.0–1.0).");

    /// <summary>
    ///     Fraction of retrieved RAG chunks cited in agent output (0.0–1.0).
    /// </summary>
    public static readonly Histogram<double> RetrievalFaithfulnessRatio = AppMeter.CreateHistogram<double>(
        "archlucid_retrieval_faithfulness_ratio",
        description: "Heuristic faithfulness of agent output vs retrieved RAG chunks (0.0–1.0).");

    /// <summary>
    ///     Per provenance response: fraction of manifest decisions with finding, rule, and graph-context edges (0.0–1.0).
    /// </summary>
    public static readonly Histogram<double> ProvenanceCompleteness = AppMeter.CreateHistogram<double>(
        "archlucid_provenance_completeness_ratio",
        description: "Decision provenance traceability completeness ratio (0.0–1.0).");

    /// <summary>Circuit breaker state changes (labels: <c>gate</c>, <c>from_state</c>, <c>to_state</c>).</summary>
    public static readonly Counter<long> CircuitBreakerStateTransitions =
        AppMeter.CreateCounter<long>(
            "archlucid_circuit_breaker_state_transitions_total",
            description: "Circuit breaker state transitions (labels: gate, from_state, to_state).");

    /// <summary>Calls rejected while open or while a half-open probe is in flight (label: <c>gate</c>).</summary>
    public static readonly Counter<long> CircuitBreakerRejections =
        AppMeter.CreateCounter<long>(
            "archlucid_circuit_breaker_rejections_total",
            description: "Calls rejected because the circuit was open or a probe was in flight (label: gate).");

    /// <summary>
    ///     LLM completions rejected by per-tenant sliding-window token quota or UTC-day budget (pre-call, in
    ///     <c>LlmCompletionAccountingClient</c>).
    /// </summary>
    public static readonly Counter<long> LlmQuotaExceededTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_quota_exceeded_total",
            description: "LLM calls rejected by tenant token quota or daily budget before outbound completion.");

    /// <summary>Monthly USD reserve admission denied due to concurrent in-flight reservation ceiling (TB-977).</summary>
    public static readonly Counter<long> LlmMonthlyBudgetAdmissionBlockedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_monthly_budget_admission_blocked_total",
            description: "Monthly USD reserve admission denied due to concurrent in-flight reservation ceiling (TB-977).");

    /// <summary>Monthly USD reserve/settle used SQL-authoritative period remap (TB-977).</summary>
    public static readonly Counter<long> LlmMonthlyBudgetPeriodRemapTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_monthly_budget_period_remap_total",
            description: "Monthly USD reserve/settle observed caller/SQL UTC month mismatch (TB-977).");

    /// <summary>Monthly USD reserve/settle optimistic concurrency retries exhausted (TB-977).</summary>
    public static readonly Counter<long> LlmMonthlyBudgetOptimisticRetryExhaustedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_monthly_budget_optimistic_retry_exhausted_total",
            description: "Monthly USD reserve/settle optimistic concurrency retries exhausted (TB-977).");

    /// <summary>Expired monthly per-call reservation leases reclaimed by background worker (TB-976).</summary>
    public static readonly Counter<long> LlmMonthlyBudgetReservationReclaimedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_monthly_budget_reservation_reclaimed_total",
            description: "Expired monthly per-call USD reservation leases reclaimed (TB-976).");

    /// <summary>Judge paths skipped fail-open when the isolated judge UTC-day token pool is exhausted (TB-190).</summary>
    public static readonly Counter<long> LlmJudgeBudgetExhaustedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_judge_budget_exhausted_total",
            description: "LLM-as-judge or faithfulness judge skipped because the judge daily token sub-cap was exhausted.");

    /// <summary>Half-open probe results (labels: <c>gate</c>, <c>outcome</c>=success|failure|cancelled).</summary>
    public static readonly Counter<long> CircuitBreakerProbeOutcomes =
        AppMeter.CreateCounter<long>(
            "archlucid_circuit_breaker_probe_outcomes_total",
            description: "Half-open probe results (labels: gate, outcome=success|failure|cancelled).");

    /// <summary>
    ///     LLM call retry attempts before the circuit breaker records a failure (labels: <c>gate</c>, <c>attempt</c>,
    ///     <c>exception_type</c>).
    /// </summary>
    public static readonly Counter<long> LlmCallRetries =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_call_retries_total",
            description:
            "LLM call retry attempts before circuit breaker recording (labels: gate, attempt, exception_type).");

    /// <summary>
    ///     HTTP 429 Too Many Responses from the LLM completion transport (labels: <c>retry_after</c>=header|fallback).
    ///     Recorded in <c>AzureOpenAiCompletionClient</c> before honoring <c>Retry-After</c> / fallback backoff.
    /// </summary>
    public static readonly Counter<long> LlmRateLimitTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_rate_limit_total",
            description:
            "LLM completion rate-limit responses (HTTP 429) before retry wait (labels: retry_after=header|fallback).");

    /// <summary>Integration outbox dead-letter rows skipped after exhausting automatic DLQ requeue attempts.</summary>
    public static readonly Counter<long> IntegrationEventDlqPermanentFailureTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_integration_event_dlq_permanent_failure_total",
            description:
            "Integration outbox dead-letter rows that exceeded automatic DLQ requeue retry budget.");

    /// <summary>
    ///     Hits on the in-resolve <c>(packId, version)</c> deserialized content cache inside
    ///     <c>EffectiveGovernanceResolver</c>
    ///     (avoids duplicate JSON work when the same version appears on multiple assignments).
    /// </summary>
    public static readonly Counter<long> GovernancePackContentDeserializeCacheHits =
        AppMeter.CreateCounter<long>("archlucid_governance_pack_content_deserialize_cache_hits");

    /// <summary>Misses on that cache (JSON deserialize executed for a distinct pack version in the resolve call).</summary>
    public static readonly Counter<long> GovernancePackContentDeserializeCacheMisses =
        AppMeter.CreateCounter<long>("archlucid_governance_pack_content_deserialize_cache_misses");

    /// <summary>Authority runs that finished the synchronous pipeline successfully (post-commit).</summary>
    public static readonly Counter<long> AuthorityRunsCompletedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_authority_runs_completed_total",
            description: "Authority runs completed through FinalizeCommittedPipelineAsync.");

    /// <summary>Authority pipeline orchestrator state transitions (labels: <c>from_state</c>, <c>to_state</c>).</summary>
    public static readonly Counter<long> OrchestratorTransitionTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_orchestrator_transition_total",
            description: "Authority pipeline orchestrator state transitions (labels: from_state, to_state).");

    /// <summary>Authority runs created (pre-pipeline, at <c>RunRecord</c> insertion).</summary>
    public static readonly Counter<long> RunsCreatedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_runs_created_total",
            description: "Authority runs created (pre-pipeline, at RunRecord insertion).");

    /// <summary>
    ///     Operator new-run wizard cost-preview fetches when <c>AgentExecution:Mode=Real</c> (no tenant / PII tags).
    /// </summary>
    public static readonly Counter<long> RunsCostPreviewViewedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid.runs.cost_preview.viewed_total",
            description: "GET /v1/agent-execution/cost-preview served for Real mode (wizard review step).");

    /// <summary>Authority pipeline runs that exceeded <c>AuthorityPipeline:PipelineTimeout</c>.</summary>
    public static readonly Counter<long> PipelineTimeoutsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_authority_pipeline_timeouts_total",
            description: "Authority pipeline executions cancelled by configured pipeline timeout.");

    /// <summary>Findings produced across completed runs (label: <c>severity</c>).</summary>
    public static readonly Counter<long> FindingsProducedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_findings_produced_total",
            description: "Findings produced across all completed runs (label: severity).");

    /// <summary>Finding engines that threw during snapshot generation (labels: <c>engine_type</c>, <c>category</c>).</summary>
    public static readonly Counter<long> FindingEngineFailuresTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_finding_engine_failures_total",
            description:
            "Finding engines that failed during findings snapshot generation (labels: engine_type, category).");

    /// <summary>Findings snapshots saved with at least one engine failure but some engines succeeded.</summary>
    public static readonly Counter<long> FindingsEnginePartialFailureTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_findings_engine_partial_failure_total",
            description:
            "Findings snapshots built with partial engine failures (at least one engine failed, at least one succeeded).");

    /// <summary>LLM completion calls made during a single <c>RealAgentExecutor.ExecuteAsync</c> batch.</summary>
    public static readonly Histogram<int> LlmCallsPerRun =
        AppMeter.CreateHistogram<int>(
            "archlucid_llm_calls_per_run",
            "{call}",
            "Number of LLM completion calls made during a single authority run.");

    /// <summary>Aggregate explanation cache hits (<c>CachingRunExplanationSummaryService</c>).</summary>
    public static readonly Counter<long> ExplanationCacheHits =
        AppMeter.CreateCounter<long>(
            "archlucid_explanation_cache_hits_total",
            description: "Aggregate explanation cache hits (via CachingRunExplanationSummaryService).");

    /// <summary>Aggregate explanation cache misses (factory invoked; LLM work may follow).</summary>
    public static readonly Counter<long> ExplanationCacheMisses =
        AppMeter.CreateCounter<long>(
            "archlucid_explanation_cache_misses_total",
            description: "Aggregate explanation cache misses (LLM call required).");

    /// <summary>
    ///     Hot-path read cache concurrent misses coalesced onto an in-flight loader for the same key (TB-2160).
    /// </summary>
    public static readonly Counter<long> HotPathReadCacheInFlightDedupedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_hot_path_read_cache_inflight_deduped_total",
            description:
            "Concurrent hot-path read cache misses that awaited an in-flight loader instead of invoking the factory again.");

    /// <summary>Ask path fell back to SQL findings/manifest text when vector retrieval failed.</summary>
    public static readonly Counter<long> RagRetrievalFallbackTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_rag_retrieval_fallback_total",
            description: "Ask retrieval fell back to SQL text search after vector index failure.");

    /// <summary>Retrieval documents skipped because ContentHash and chunking fingerprint are unchanged (TB-046).</summary>
    public static readonly Counter<long> RetrievalIndexDocumentSkippedUnchangedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_retrieval_index_documents_skipped_unchanged_total",
            description: "Retrieval documents skipped because content hash and chunking fingerprint are unchanged.");

    /// <summary>Retrieval documents re-indexed after content or chunking changes (TB-046 / TB-047).</summary>
    public static readonly Counter<long> RetrievalIndexDocumentReindexedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_retrieval_index_documents_reindexed_total",
            description: "Retrieval documents embedded and upserted.");

    /// <summary>Retrieval documents whose prior chunks were removed due to chunking fingerprint change (TB-047).</summary>
    public static readonly Counter<long> RetrievalIndexChunkingFingerprintInvalidatedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_retrieval_index_chunking_fingerprint_invalidated_total",
            description: "Retrieval documents whose chunks were removed before re-index due to chunking fingerprint change.");

    /// <summary>Retrieval chunks skipped because stored/query embedding dimensions differ (TB-045).</summary>
    public static readonly Counter<long> RetrievalEmbeddingDimensionMismatchTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_retrieval_embedding_dimension_mismatch_total",
            description: "Retrieval chunks skipped because stored/query embedding dimensions differ.");

    /// <summary>Startup corpus indexer failures (fail-open) by corpus kind (TB-046).</summary>
    public static readonly Counter<long> RetrievalCorpusStartupIndexerFailureTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_retrieval_corpus_startup_indexer_failure_total",
            description: "Startup corpus indexer failures by corpus kind.");

    /// <summary>Decision provenance snapshots persisted (TB-037).</summary>
    public static readonly Counter<long> ProvenanceSnapshotWritesTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_provenance_snapshot_writes_total",
            description: "Decision provenance snapshots upserted after commit or rebuild.");

    /// <summary>Provenance graph served from a fresh persisted snapshot (revision hash match).</summary>
    public static readonly Counter<long> ProvenanceSnapshotReadHitsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_provenance_snapshot_read_hits_total",
            description: "Provenance reads satisfied from persisted snapshot without rebuild.");

    /// <summary>Provenance graph rebuilt because snapshot missing or revision stale.</summary>
    public static readonly Counter<long> ProvenanceSnapshotRebuildFallbackTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_provenance_snapshot_rebuild_fallback_total",
            description: "Provenance reads that rebuilt the graph (missing or stale snapshot).");

    /// <summary>Azure Retail Prices structured lookup used a heuristic monthly USD estimate (Improvement #6).</summary>
    public static readonly Counter<long> AzureRetailPricesHeuristicFallbackTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_azure_retail_prices_heuristic_fallback_total",
            description: "Azure Retail Prices catalog miss resolved via heuristic SKU estimate.");

    /// <summary>
    ///     Wall time for vector retrieval search (embed + index query; labels <c>corpus_kind</c> = single kind,
    ///     <c>mixed</c>, or <c>none</c> when empty).
    /// </summary>
    public static readonly Histogram<double> RagRetrievalDurationMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid_rag_retrieval_duration_ms",
            "ms",
            "Wall time for RAG vector retrieval (embed + vector index search).");

    /// <summary>Post-vector semantic rerank wall time (Improvement #23).</summary>
    public static readonly Histogram<double> RetrievalRerankLatencyMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid.rerank.latency_ms",
            "ms",
            "Wall time for retrieval rerank (semantic ranker or lexical fallback).");

    /// <summary>
    ///     Chunks returned per retrieval search grouped by <c>corpus_kind</c> (Improvement 7; histogram not counter
    ///     per assessment spec).
    /// </summary>
    public static readonly Histogram<int> RagChunksRetrieved =
        AppMeter.CreateHistogram<int>(
            "archlucid_rag_chunks_retrieved_total",
            "{chunk}",
            "Number of retrieval chunks returned per vector search (label corpus_kind).");

    /// <summary>Graph-RAG 1-hop neighbor hits appended during retrieval expansion (V1 §2.20).</summary>
    public static readonly Counter<long> GraphRagNeighborsAddedTotal =
        AppMeter.CreateCounter<long>(
            "graph_rag_neighbors_added_total",
            description: "Graph-RAG neighbor chunks appended during retrieval expansion.");

    /// <summary>Wall time for Graph-RAG neighbor expansion per retrieval query.</summary>
    public static readonly Histogram<double> GraphRagExpansionLatencyMilliseconds =
        AppMeter.CreateHistogram<double>(
            "graph_rag_expansion_latency_ms",
            "ms",
            "Wall time for Graph-RAG 1-hop neighbor expansion.");

    /// <summary>Integration outbox Service Bus publish succeeded (label <c>event_type</c> low-cardinality literal).</summary>
    public static readonly Counter<long> IntegrationEventDeliverySuccessTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_integration_event_delivery_success_total",
            description: "Integration event outbox rows published to Service Bus successfully (label event_type).");

    /// <summary>Integration outbox publish attempt failed (label <c>event_type</c>; row may retry or dead-letter).</summary>
    public static readonly Counter<long> IntegrationEventDeliveryFailedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_integration_event_delivery_failed_total",
            description: "Integration event outbox publish failures (label event_type).");

    /// <summary>Run-export blob push outbox rows processed successfully (blob pushed or benign skip).</summary>
    public static readonly Counter<long> RunExportBlobPushOutboxProcessedSuccessTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_run_export_blob_push_outbox_processed_success_total",
            description: "Run-export blob push outbox rows marked processed without dead-letter.");

    /// <summary>Run-export blob push outbox transient failures scheduled for retry.</summary>
    public static readonly Counter<long> RunExportBlobPushOutboxRetryScheduledTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_run_export_blob_push_outbox_retry_scheduled_total",
            description: "Run-export blob push outbox rows that recorded backoff after a processing failure.");

    /// <summary>Run-export blob push outbox rows moved to dead-letter state.</summary>
    public static readonly Counter<long> RunExportBlobPushOutboxDeadLetteredTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_run_export_blob_push_outbox_dead_lettered_total",
            description: "Run-export blob push outbox rows dead-lettered after non-retryable failure or exhausted retries.");

    /// <summary>Post-commit projection outbox rows processed successfully (side effect completed or benign skip).</summary>
    public static readonly Counter<long> PostCommitProjectionOutboxProcessedSuccessTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_post_commit_projection_outbox_processed_success_total",
            description: "Post-commit projection outbox rows marked processed without dead-letter.");

    /// <summary>Post-commit projection outbox transient failures scheduled for retry.</summary>
    public static readonly Counter<long> PostCommitProjectionOutboxRetryScheduledTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_post_commit_projection_outbox_retry_scheduled_total",
            description: "Post-commit projection outbox rows that recorded backoff after a processing failure.");

    /// <summary>Post-commit projection outbox rows moved to dead-letter state.</summary>
    public static readonly Counter<long> PostCommitProjectionOutboxDeadLetteredTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_post_commit_projection_outbox_dead_lettered_total",
            description: "Post-commit projection outbox rows dead-lettered after non-retryable failure or exhausted retries.");

    /// <summary>LLM completion response cache hits (<c>CachingLlmCompletionClient</c>, label <c>agent_type</c>).</summary>
    public static readonly Counter<long> LlmCompletionCacheHitsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_cache_hits_total",
            description: "LLM completion response cache hits (label: agent_type).");

    /// <summary>LLM completion response cache misses (<c>CachingLlmCompletionClient</c>, label <c>agent_type</c>).</summary>
    public static readonly Counter<long> LlmCompletionCacheMissesTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_cache_misses_total",
            description: "LLM completion response cache misses (label: agent_type).");

    /// <summary>
    ///     Completion-cache entries removed after a cache-served body failed wire/schema admission (TB-940 poison bust).
    /// </summary>
    public static readonly Counter<long> LlmCompletionCachePoisonBustsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_cache_poison_busts_total",
            description: "LLM completion cache poison busts after cache-served admission failure (label: agent_type).");

    /// <summary>LLM completions that used the fallback client after primary throttling or server errors (labels: deployment).</summary>
    public static readonly Counter<long> LlmCompletionFallbackEngagementsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_completion_fallback_engagements_total",
            description: "LLM completion calls fulfilled via FallbackAgentCompletionClient (label: deployment).");


    /// <summary>In-process cache hits for <c>GET /v1/demo/preview</c> (marketing commit-page bundle).</summary>
    public static readonly Counter<long> DemoPreviewCacheHits =
        AppMeter.CreateCounter<long>(
            "archlucid.demo.preview.cache_hit_total",
            description: "Demo marketing preview bundle cache hits (GET /v1/demo/preview).");

    /// <summary>In-process cache misses for <c>GET /v1/demo/preview</c> (factory invoked).</summary>
    public static readonly Counter<long> DemoPreviewCacheMisses =
        AppMeter.CreateCounter<long>(
            "archlucid.demo.preview.cache_miss_total",
            description: "Demo marketing preview bundle cache misses (GET /v1/demo/preview).");

    /// <summary><c>archlucid try --real</c> path: execute invoked with pilot try header (API-side proxy for CLI intent).</summary>
    public static readonly Counter<long> TryRealModeAttemptedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid.try.real_mode.attempted_total",
            description: "archlucid try --real: pilot-marked execute attempts.");

    /// <summary><c>archlucid try --real</c> path: pilot-marked execute returned success.</summary>
    public static readonly Counter<long> TryRealModeSucceededTotal =
        AppMeter.CreateCounter<long>(
            "archlucid.try.real_mode.succeeded_total",
            description: "archlucid try --real: pilot-marked execute successes.");

    /// <summary><c>archlucid try --real</c> path: simulator substitution after seed-fake-results fallback.</summary>
    public static readonly Counter<long> TryRealModeFellBackToSimulatorTotal =
        AppMeter.CreateCounter<long>(
            "archlucid.try.real_mode.fellback_to_simulator_total",
            description: "archlucid try --real: fell back to simulator output (development seed path).");

    /// <summary>
    ///     Schema validation of raw <c>AgentResult</c> LLM JSON (labels: <c>agent_type</c>, <c>outcome</c>
    ///     =valid|invalid).
    /// </summary>
    public static readonly Counter<long> AgentResultSchemaValidationsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_agent_result_schema_validations_total",
            description: "Schema validation of raw AgentResult LLM output (labels: agent_type, outcome).");

    /// <summary>Follow-up LLM attempts after an <c>AgentResult</c> schema violation (label: <c>agent_type</c>).</summary>
    public static readonly Counter<long> AgentSchemaRemediationRetriesTotal =
        AppMeter.CreateCounter<long>(
            "archlucid.agent.schema_remediation_retries_total",
            description: "Remediation LLM attempts after AgentResult schema validation failed (label: agent_type).");

    /// <summary>
    ///     Successful <c>AgentResult</c> parses after schema remediation (labels: <c>agent_type</c>, <c>schema_retry_count</c>).
    /// </summary>
    public static readonly Counter<long> AgentSchemaRemediationCompletionsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid.agent.schema_remediation_completions_total",
            description: "Successful AgentResult parses after schema remediation (labels: agent_type, schema_retry_count).");

    /// <summary>
    ///     Schema validation of explanation LLM JSON (labels: <c>explanation_type</c>, <c>outcome</c>
    ///     =valid|invalid|skipped).
    /// </summary>
    public static readonly Counter<long> ExplanationSchemaValidationsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_explanation_schema_validations_total",
            description: "Schema validation of explanation LLM payloads (labels: explanation_type, outcome).");

    /// <summary>
    ///     Successful explanation LLM completions after a schema-validation retry (label: <c>explanation_type</c>).
    /// </summary>
    public static readonly Counter<long> ExplanationRetrySuccessTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_explanation_retry_success_total",
            description: "Explanation LLM schema retry succeeded (label: explanation_type).");

    /// <summary>Per-stage wall time inside the authority pipeline (labels: <c>stage</c>, <c>outcome</c>=success|error).</summary>
    public static readonly Histogram<double> AuthorityPipelineStageDurationMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid_authority_pipeline_stage_duration_ms",
            "ms",
            "Per-stage wall time inside the authority pipeline (labels: stage, outcome).");

    /// <summary>
    ///     Staged Critic batch phases in <c>RealAgentExecutor</c> (labels: <c>phase</c>=phase1|phase2, <c>outcome</c>).
    /// </summary>
    public static readonly Histogram<double> AgentExecutionStagedCriticPhaseDurationMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid_agent_execution_staged_critic_phase_duration_ms",
            "ms",
            "Staged Critic batch phase wall time in RealAgentExecutor (labels: phase=phase1|phase2, outcome).");

    /// <summary>
    ///     Authority pipeline stages skipped because run header checkpoint FKs were already set (label <c>stage</c>).
    /// </summary>
    public static readonly Counter<long> AuthorityPipelineStageSkippedCheckpointTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_authority_pipeline_stage_skipped_checkpoint_total",
            description: "Authority pipeline stage skipped on retry due to persisted checkpoint (labels: stage).");

    /// <summary>Successful self-service trial activations (labels: <c>source</c>, <c>mode</c>).</summary>
    public static readonly Counter<long> TrialSignupsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_trial_signups_total",
            description: "Self-service trial funnel: successful trial activations (labels: source, mode).");

    /// <summary>Signup marketing attribution conversions (labels: <c>attribution.medium</c>, <c>attribution.platform</c>).</summary>
    public static readonly Counter<long> SignupMarketingConversionTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_signup_marketing_conversion_total",
            description: "First-touch signup attribution persisted after successful trial provision (coarse buckets only).");

    /// <summary>LLM wallet auto-refill USD credited (TB-014).</summary>
    public static readonly Counter<double> LlmWalletRefillUsdTotal =
        AppMeter.CreateCounter<double>(
            "archlucid_llm_wallet_refill_usd_total",
            "USD",
            "LLM prepaid wallet refill USD credited after successful Stripe charge.");

    /// <summary>LLM wallet auto-refill failures (label: <c>stripe_decline_code</c>).</summary>
    public static readonly Counter<long> LlmWalletRefillFailuresTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_wallet_refill_failures_total",
            description: "LLM wallet auto-refill Stripe failures (label stripe_decline_code).");

    /// <summary>Failed signup / trial bootstrap attempts (labels: <c>stage</c>, <c>reason</c>).</summary>
    public static readonly Counter<long> TrialSignupFailuresTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_trial_signup_failures_total",
            description: "Self-service trial funnel: failed signup or bootstrap attempts (labels: stage, reason).");

    /// <summary>Background health check of <c>GET /v1/demo/preview</c> (labels: <c>outcome</c>=success|failure).</summary>
    public static readonly Counter<long> TrialFunnelHealthProbeTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_trial_funnel_health_probe_total",
            description: "Trial funnel demo preview probe outcomes (label outcome=success|failure).");

    /// <summary>Failed <c>POST /v1/register</c> HTTP responses (labels: <c>reason</c>=validation|conflict|internal).</summary>
    public static readonly Counter<long> TrialRegistrationFailuresTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_trial_registration_failures_total",
            description: "Self-service registration API failures (label reason=validation|conflict|internal).");

    /// <summary>Email OTP challenge requests (labels: <c>result</c>).</summary>
    public static readonly Counter<long> EmailOtpChallengeRequestedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_email_otp_challenge_requested_total",
            description: "Email OTP challenge requests (label result=accepted|rate_limited|sso_required|disabled|invalid_email|bot_challenge_failed).");

    /// <summary>Email OTP verify attempts (labels: <c>result</c>).</summary>
    public static readonly Counter<long> EmailOtpChallengeVerifiedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_email_otp_challenge_verified_total",
            description: "Email OTP verify attempts (label result=success|invalid|expired|rate_limited|sso_required).");

    /// <summary>Email OTP outbound delivery failures.</summary>
    public static readonly Counter<long> EmailOtpDeliveryFailedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_email_otp_delivery_failed_total",
            description: "Email OTP sign-in code delivery failures.");

    /// <summary>Email OTP rate-limit triggers (labels: <c>scope</c>=email|ip|email_verification_hourly).</summary>
    public static readonly Counter<long> EmailOtpRateLimitTriggeredTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_email_otp_rate_limit_triggered_total",
            description: "Email OTP rate-limit triggers (label scope).");

    /// <summary>Self-service trial abuse denials (labels: <c>reason</c>).</summary>
    public static readonly Counter<long> SelfServiceTrialAbuseDeniedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_self_service_trial_abuse_denied_total",
            description: "Self-service trial/workspace abuse policy denials (label reason).");

    /// <summary>
    ///     Successful <c>POST /v1/register</c> where the prospect did not supply <c>baselineReviewCycleHours</c> (soft-default
    ///     / model path).
    /// </summary>
    public static readonly Counter<long> TrialSignupBaselineSkippedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_trial_signup_baseline_skipped_total",
            description: "Self-service trial signup completed without tenant-supplied baseline review-cycle hours.");

    /// <summary>Manual prep / people-per-review baseline persisted (settings UI gate).</summary>
    public static readonly Counter<long> BaselineManualPrepCapturedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_baseline_manual_prep_captured_total",
            description: "Tenant manual baseline fields saved (PUT /v1/tenant/baseline).");

    /// <summary>Seconds from trial anchor (<c>TrialStartUtc</c> when set, otherwise <c>CreatedUtc</c>) to first committed manifest.</summary>
    public static readonly Histogram<double> TrialFirstRunSeconds =
        AppMeter.CreateHistogram(
            "archlucid_trial_first_run_seconds",
            "s",
            "Seconds from tenant trial anchor (TrialStartUtc or CreatedUtc) to first committed manifest.",
            advice: new InstrumentAdvice<double>
            {
                HistogramBucketBoundaries =
                [
                    5, 15, 30, 60, 120, 300, 600, 1200, 3600, 7200, 86400
                ]
            });

    /// <summary>
    ///     Seconds from tenant anchor to first golden manifest commit for any tenant (labels: <c>tenant_kind</c>
    ///     = <c>trial</c> | <c>non_trial</c>).
    /// </summary>
    public static readonly Histogram<double> TenantTimeToFirstCommitSeconds =
        AppMeter.CreateHistogram(
            "archlucid_tenant_time_to_first_commit_seconds",
            "s",
            "Seconds from tenant anchor (TrialStartUtc or CreatedUtc) to first committed manifest (all tenants).",
            advice: new InstrumentAdvice<double>
            {
                HistogramBucketBoundaries =
                [
                    5, 15, 30, 60, 120, 300, 600, 1200, 3600, 7200, 86400
                ]
            });

    /// <summary>
    ///     Age in hours of unanswered marketing pricing quote requests (labels: <c>breach_status</c>).
    ///     Populated every five minutes by <c>MarketingPricingQuoteAgingMetricsHostedService</c>.
    /// </summary>
    public static readonly Histogram<double> PricingQuoteRequestAgeHours =
        AppMeter.CreateHistogram(
            "archlucid_pricing_quote_request_age_hours",
            "hours",
            "Age in hours of unanswered marketing pricing quote requests.",
            advice: new InstrumentAdvice<double>
            {
                HistogramBucketBoundaries =
                [
                    1, 6, 12, 18, 24, 48, 72, 168
                ]
            });

    /// <summary><c>TrialRunsUsed / TrialRunsLimit</c> at first manifest commit for metered trials (0.0–1.0+).</summary>
    public static readonly Histogram<double> TrialRunsUsedRatio =
        AppMeter.CreateHistogram(
            "archlucid_trial_runs_used_ratio",
            description: "TrialRunsUsed divided by TrialRunsLimit when the first manifest commits (labels none).",
            advice: new InstrumentAdvice<double>
            {
                HistogramBucketBoundaries =
                [
                    0.05, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95, 1.0, 1.25, 2.0
                ]
            });

    /// <summary>Trial conversions to paid or higher tier (labels: <c>from_state</c>, <c>to_tier</c>).</summary>
    public static readonly Counter<long> TrialConversionTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_trial_conversion_total",
            description: "Trial conversions (labels: from_state, to_tier).");

    /// <summary>Automated lifecycle transitions toward expiry / deletion (label <c>reason</c>).</summary>
    public static readonly Counter<long> TrialExpirationsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_trial_expirations_total",
            description: "Trial lifecycle transitions applied by automation (label: reason).");

    /// <summary>Usage-based trial upgrade nudge renders in the operator shell (label <c>trigger</c>).</summary>
    public static readonly Counter<long> TrialUpgradeNudgeShownTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_trial_upgrade_nudge_shown_total",
            description: "Trial upgrade nudge shown in operator shell (label: trigger=runs|seats|expiry).");

    /// <summary>Usage-based trial upgrade nudge CTA clicks (label <c>trigger</c>).</summary>
    public static readonly Counter<long> TrialUpgradeNudgeClickedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_trial_upgrade_nudge_clicked_total",
            description: "Trial upgrade nudge CTA clicks (label: trigger=runs|seats|expiry).");

    /// <summary>Paid Team expansion nudge renders in the operator shell (label <c>trigger</c>).</summary>
    public static readonly Counter<long> TeamExpansionNudgeShownTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_team_expansion_nudge_shown_total",
            description: "Team expansion nudge shown in operator shell (label: trigger=seats|workspaces).");

    /// <summary>Paid Team expansion nudge CTA clicks (label <c>trigger</c>).</summary>
    public static readonly Counter<long> TeamExpansionNudgeClickedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_team_expansion_nudge_clicked_total",
            description: "Team expansion nudge CTA clicks (label: trigger=seats|workspaces).");

    /// <summary>First successful golden-manifest commit per tenant (Core Pilot onboarding funnel).</summary>
    public static readonly Counter<long> FirstSessionCompletedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_first_session_completed_total",
            description: "Increments once per tenant on first successful manifest commit.");

    /// <summary>
    ///     Wall-clock minutes from wizard run creation to first committed manifest (TB-220; labels
    ///     <c>execution_mode</c>, <c>preset_used</c>).
    /// </summary>
    public static readonly Histogram<double> WizardToCommittedMinutes =
        AppMeter.CreateHistogram<double>(
            "archlucid.pilot.wizard_to_committed_minutes",
            "min",
            "Wall-clock minutes from wizard submit to first committed manifest (labels execution_mode, preset_used).");

    /// <summary>
    ///     First-tenant onboarding funnel events (Improvement 12). Aggregated counter — the
    ///     <c>event</c> tag is the only label by default. The <c>tenant_id</c> tag is added only when the
    ///     <c>Telemetry:FirstTenantFunnel:PerTenantEmission</c> feature flag is on (owner-only flip per
    ///     pending question 40 / <c>docs/security/PRIVACY_NOTE.md</c> §3.A).
    /// </summary>
    public static readonly Counter<long> FirstTenantFunnelEventsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_first_tenant_funnel_events_total",
            description:
            "First-tenant onboarding funnel events (label: event includes signup|tour_opt_in|first_run_started|first_run_committed|first_finding_viewed|first_finalization_attempted|first_export_opened|thirty_minute_milestone). tenant_id label added ONLY when Telemetry:FirstTenantFunnel:PerTenantEmission is true.");

    /// <summary>
    ///     Operator onboarding funnel successes (labels: <c>task</c> = <c>first_run_committed</c> |
    ///     <c>first_session_completed</c>).
    /// </summary>
    public static readonly Counter<long> OperatorTaskSuccessTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_operator_task_success_total",
            description:
            "Server-side verified onboarding milestones (label task=first_run_committed|first_session_completed).");

    /// <summary>
    ///     Operator UI sponsor banner showed the days-since-first-commit badge (labels: <c>tenant_id</c>,
    ///     <c>days_since_first_commit_bucket</c>).
    /// </summary>
    public static readonly Counter<long> SponsorBannerFirstCommitBadgeRenderedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid.ui.sponsor_banner.first_commit_badge_rendered",
            description:
            "Sponsor banner first-commit badge render (operator shell). Labels: tenant_id, days_since_first_commit_bucket.");

    /// <summary>
    ///     Guided Core Pilot checklist progress from the operator shell (labels:
    ///     <c>step</c> = canonical slug; four steps only — low cardinality).
    /// </summary>
    public static readonly Counter<long> CorePilotRailChecklistStepsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_core_pilot_rail_checklist_step_total",
            description:
            "Operator-shell Core Pilot checklist step acknowledgements POST /v1/diagnostics/core-pilot-rail-step (label step slug).");

    /// <summary>Deny-list redactions applied before Azure OpenAI and trace persistence (label <c>category</c>).</summary>
    public static readonly Counter<long> LlmPromptRedactionsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_prompt_redactions_total",
            description: "Outbound LLM prompt redactions (labels: email|ssn|credit_card|jwt|api_key|custom).");

    /// <summary>LLM completions while <c>LlmPromptRedaction:Enabled</c> is false (audit deliberate bypass).</summary>
    public static readonly Counter<long> LlmPromptRedactionSkippedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_prompt_redaction_skipped_total",
            description: "LLM completions observed while prompt redaction is disabled.");

    /// <summary>Azure AI Content Safety blocks on LLM envelope prompts/responses (labels <c>stage</c>, <c>category</c>).</summary>
    public static readonly Counter<long> LlmContentSafetyBlockedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_content_safety_blocked_total",
            description: "Content safety blocked outbound prompts or completions (labels stage, category).");

    /// <summary>Evidence-package scalar fields rewritten after deterministic injection-pattern match.</summary>
    public static readonly Counter<long> EvidenceInjectionFieldsRedactedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_evidence_prompt_injection_fields_redacted_total",
            description: "Evidence scalar fields redacted after prompt-injection heuristics matched.");

    /// <summary>Billing checkout attempts (labels: <c>provider</c>, <c>tier</c>, <c>outcome</c>).</summary>
    public static readonly Counter<long> BillingCheckoutsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_billing_checkouts_total",
            description: "Billing checkout sessions (labels: provider, tier, outcome).");

    /// <summary>Production agent handler completions (label: <c>agent_type_key</c>, <c>outcome</c>=success|error|degraded).</summary>
    public static readonly Counter<long> AgentHandlerInvocationsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_agent_handler_invocations_total",
            description: "Agent handler invocations by type and outcome.");

    /// <summary>
    ///     Execute retry skipped handler dispatch because a persisted non-degraded result exists (labels:
    ///     <c>agent_type</c>, <c>reason</c>).
    /// </summary>
    public static readonly Counter<long> AgentExecuteTaskSkippedIdempotentTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_agent_execute_task_skipped_idempotent_total",
            description: "Agent execute retry skipped handler dispatch for idempotent task (labels: agent_type, reason).");

    /// <summary>
    ///     Non-Critic handler resilience fallbacks that returned a degraded placeholder (labels: <c>agent_type_key</c>,
    ///     <c>degradation_reason</c>).
    /// </summary>
    public static readonly Counter<long> AgentHandlerDegradationsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_agent_handler_degradations_total",
            description: "Non-Critic agent handler degraded fallbacks (labels: agent_type_key, degradation_reason).");

    /// <summary>
    ///     Fraction of expected <c>AgentResult</c> JSON keys present on <c>ParsedResultJson</c> (0.0–1.0; label
    ///     <c>agent_type</c>).
    /// </summary>
    public static readonly Histogram<double> AgentOutputStructuralCompletenessRatio =
        AppMeter.CreateHistogram<double>(
            "archlucid_agent_output_structural_completeness_ratio",
            description: "Structural completeness of persisted agent parsed JSON (0.0–1.0).");

    /// <summary>
    ///     Trace JSON that is not a JSON object or failed <see cref="System.Text.Json" /> parse (label <c>agent_type</c>
    ///     ).
    /// </summary>
    public static readonly Counter<long> AgentOutputParseFailuresTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_agent_output_parse_failures_total",
            description: "Agent trace ParsedResultJson parse/root-kind failures.");

    /// <summary>Total failed agent trace blob uploads after all retries (labels: <c>agent_type</c>, <c>blob_type</c>).</summary>
    public static readonly Counter<long> AgentTraceBlobUploadFailuresTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_agent_trace_blob_upload_failures_total",
            description: "Total failed agent trace blob uploads after all retries.");

    /// <summary>Wall-clock milliseconds to complete agent trace full-text blob persistence (label <c>agent_type</c>).</summary>
    public static readonly Histogram<double> AgentTraceBlobPersistDurationMs =
        AppMeter.CreateHistogram<double>(
            "archlucid_agent_trace_blob_persist_duration_ms",
            "ms",
            "Duration in milliseconds for full prompt/response blob writes per trace.");

    /// <summary>
    ///     Real-mode SQL inline fallback for full prompt/response when blob key is missing (labels: <c>agent_type</c>,
    ///     <c>blob_type</c>=system_prompt|user_prompt|response).
    /// </summary>
    public static readonly Counter<long> AgentTracePromptInlineFallbacksTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_agent_trace_prompt_inline_fallback_total",
            description: "Full-text agent trace fields stored inline after blob miss (Real execution only).");

    /// <summary>
    ///     Distribution of <c>OverallSemanticScore</c> (0–1; label <c>agent_type</c>): deterministic heuristic checks on
    ///     persisted agent JSON (claim evidence refs, finding field completeness), optionally combined with an LLM rubric when
    ///     enabled — <b>not</b> embedding cosine similarity nor a guarantee of factual correctness. For optional embedding
    ///     alignment telemetry see <see cref="AgentOutputEmbeddingFaithfulnessMeanCosine" />.
    /// </summary>
    public static readonly Histogram<double> AgentOutputSemanticScore =
        AppMeter.CreateHistogram<double>(
            "archlucid_agent_output_semantic_score",
            description:
            "OverallSemanticScore (0-1): heuristic JSON-structure quality (claims/findings), optionally with LLM judge — not embeddings or ground truth.");

    /// <summary>
    ///     AgentResult embedding faithfulness mean cosine vs evidence (clamped 0–1 for telemetry; label <c>agent_type</c>) when
    ///     embedding scorer runs.
    /// </summary>
    public static readonly Histogram<double> AgentOutputEmbeddingFaithfulnessMeanCosine =
        AppMeter.CreateHistogram<double>(
            "archlucid_agent_output_embedding_faithfulness_mean_cosine",
            description: "Mean cosine similarity between claims/findings and evidence chunks (0-1 clamp).");

    /// <summary>
    ///     Embedding faithfulness cosine score for agent output evaluation (0–1; label <c>agent_type</c>) when
    ///     <c>ArchLucid:Agents:Faithfulness:EmbeddingEnabled</c> is true.
    /// </summary>
    public static readonly Histogram<double> AgentFaithfulnessCosine =
        AppMeter.CreateHistogram<double>(
            "archlucid.agent.faithfulness_cosine",
            description: "Embedding faithfulness cosine similarity for agent JSON vs evidence (0-1).");

    /// <summary>Absolute delta between LLM judge median score and heuristic semantic score (label <c>agent_type</c>).</summary>
    public static readonly Histogram<double> AgentOutputJudgeDisagreement =
        AppMeter.CreateHistogram<double>(
            "archlucid_agent_output_judge_disagreement",
            description: "LLM judge vs heuristic semantic disagreement magnitude (0-1).");

    /// <summary>
    ///     LLM faithfulness score comparing agent JSON against evidence chunks (0–1; label <c>agent_type</c>) when enabled.
    /// </summary>
    public static readonly Histogram<double> AgentOutputLlmFaithfulnessScore =
        AppMeter.CreateHistogram<double>(
            "archlucid_agent_output_llm_faithfulness_score",
            description: "LLM faithfulness score vs run evidence package (0-1).");

    /// <summary>
    ///     Quality gate outcomes after structural + semantic evaluation (labels: <c>agent_type</c>, <c>outcome</c>
    ///     =accepted|warned|rejected, <c>gate_mode</c>, <c>reject_reason</c>, <c>execution_mode</c>).
    /// </summary>
    public static readonly Counter<long> AgentOutputQualityGateTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_agent_output_quality_gate_total",
            description:
            "Agent output quality gate outcomes (labels: agent_type, outcome, gate_mode, reject_reason, execution_mode).");

    /// <summary>Reference-case evaluation outcomes (labels: <c>case_id</c>, <c>agent_type</c>, <c>outcome</c>=pass|fail).</summary>
    public static readonly Counter<long> AgentOutputReferenceCaseEvaluationsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_agent_output_reference_case_evaluations_total",
            description: "Reference-case agent output evaluations (labels: case_id, agent_type, outcome=pass|fail).");

    /// <summary>
    ///     Mean of structural completeness and semantic score for each reference-case evaluation (labels: <c>case_id</c>,
    ///     <c>agent_type</c>).
    /// </summary>
    public static readonly Histogram<double> AgentOutputReferenceCaseScoreRatio =
        AppMeter.CreateHistogram<double>(
            "archlucid_agent_output_reference_case_score_ratio",
            description: "Combined reference-case score (structural+semantic)/2 (0.0–1.0).");

    /// <summary>
    ///     Aggregate explanation replaced LLM text with deterministic manifest narrative due to low explanation faithfulness.
    /// </summary>
    public static readonly Counter<long> ExplanationAggregateFaithfulnessFallbacksTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_explanation_aggregate_faithfulness_fallback_total",
            description: "Aggregate run explanation used deterministic narrative after low faithfulness vs findings.");

    /// <summary>Citation chips emitted on aggregate explanations (label <c>kind</c>: <c>CitationKind</c> enum name).</summary>
    public static readonly Counter<long> ExplanationCitationsEmitted =
        AppMeter.CreateCounter<long>(
            "archlucid_explanation_citations_emitted_total",
            description: "Citation references attached to aggregate run explanations (label kind).");

    /// <summary>Rows detected by consistency probes referencing missing authority state (labels <c>table</c>, <c>column</c>).</summary>
    public static readonly Counter<long> DataConsistencyOrphansDetected =
        AppMeter.CreateCounter<long>(
            "archlucid_data_consistency_orphans_detected_total",
            description: "Orphan authority-chain rows detected (labels table, column; e.g. GoldenManifests.RunId).");

    /// <summary>
    ///     Committed run header pointer violations (labels <c>pointer</c> — e.g. ContextSnapshotId).
    /// </summary>
    public static readonly Counter<long> DataConsistencyHeaderRepointsDetected =
        AppMeter.CreateCounter<long>(
            "archlucid_data_consistency_header_repoints_detected_total",
            description:
            "Committed dbo.Runs evidence pointers referencing missing or cross-run child rows (label pointer).");

    /// <summary>Executive ROI background jobs skipped a tenant because tenant/workspace/project scope failed validation (fail-closed).</summary>
    public static readonly Counter<long> ExecutiveRoiBackgroundScopeViolationsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_executive_roi_background_scope_violations_total",
            description: "Leader-elected Executive ROI cache warmup / savings gauge skipped a tenant due to invalid ambient scope (labels reason).");

    /// <summary>Environment-graded alert when orphan count meets threshold (labels <c>table</c>, <c>column</c>).</summary>
    public static readonly Counter<long> DataConsistencyAlerts =
        AppMeter.CreateCounter<long>(
            "archlucid_data_consistency_alerts_total",
            description: "Data consistency enforcement alert increments (labels table, column).");

    /// <summary>Rows inserted into <c>dbo.DataConsistencyQuarantine</c> from orphan probes (labels <c>table</c>, <c>column</c>).</summary>
    public static readonly Counter<long> DataConsistencyOrphansQuarantined =
        AppMeter.CreateCounter<long>(
            "archlucid_data_consistency_orphans_quarantined_total",
            description:
            "Orphan rows quarantined (inserted into dbo.DataConsistencyQuarantine; labels table, column).");

    /// <summary>Wall time for scheduled read-only data consistency reconciliation (full pass).</summary>
    public static readonly Histogram<double> DataConsistencyReconciliationDurationMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid_data_consistency_check_duration_ms",
            "ms",
            "Wall time for scheduled data consistency reconciliation (read-only checks).");

    /// <summary>Findings emitted during data consistency reconciliation (labels <c>severity</c>, <c>check_name</c>).</summary>
    public static readonly Counter<long> DataConsistencyReconciliationFindingsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_data_consistency_findings_total",
            description: "Data consistency reconciliation findings (labels severity, check_name).");

    /// <summary><c>ArchLucid.Jobs.Cli</c> / <c>IArchLucidJob</c> executions (labels: <c>job_name</c>, <c>exit_class</c>).</summary>
    public static readonly Counter<long> ContainerJobRunsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_container_job_runs_total",
            description:
            "ArchLucid.Jobs.Cli job runs (labels: job_name, exit_class=success|failure|unknown_job|configuration_error|cancelled).");

    /// <summary>Wall time for <c>IArchLucidJob.RunOnceAsync</c> (labels: <c>job_name</c>, <c>exit_code</c>).</summary>
    public static readonly Histogram<double> ContainerJobRunDurationMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid_container_job_run_duration_ms",
            "ms",
            "Duration of one-shot background jobs (labels: job_name, exit_code).");

    /// <summary>
    ///     Audit events dropped because the in-memory retry queue was full (hot-path enqueue or requeue after drain
    ///     failure).
    /// </summary>
    public static readonly Counter<long> AuditRetryEnqueueDroppedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_audit_retry_enqueue_dropped_total",
            description: "Audit retry queue dropped events because the bounded channel was full.");

    /// <summary>
    ///     Durable SQL audit writes abandoned after <see cref="ArchLucid.Core.Audit.DurableAuditLogRetry.TryLogAsync" />
    ///     exhausted retries (label <c>event_type</c>).
    /// </summary>
    public static readonly Counter<long> AuditWriteFailuresTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_audit_write_failures_total",
            description: "Durable audit writes abandoned after max retries (label event_type).");

    /// <summary>
    ///     Required (fail-closed) audit writes abandoned after
    ///     <see cref="ArchLucid.Core.Audit.DurableAuditLogRetry.LogOrThrowAsync" /> retries (label <c>event_type</c>).
    ///     Pageable via Prometheus <c>ArchLucidRequiredAuditWriteAbandon</c> — never incremented on informational
    ///     <see cref="ArchLucid.Core.Audit.DurableAuditLogRetry.TryLogAsync" /> (TB-955 / INV-003).
    /// </summary>
    public static readonly Counter<long> RequiredAuditWriteAbandonsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_required_audit_write_abandons_total",
            description: "Required durable audit writes abandoned after LogOrThrow retries (label event_type).");

    /// <summary>
    ///     Domain rows missing expected Required audit events within the orphan-probe grace window
    ///     (label <c>domain</c>: governance_approved, governance_rejected, golden_manifest_finalized).
    /// </summary>
    public static readonly Counter<long> RequiredAuditTrailOrphansDetectedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_required_audit_trail_orphans_detected_total",
            description: "Required audit trail orphan probe detections (label domain).");

    /// <summary>
    ///     Pageable-equivalent increment when Required audit trail orphan counts are above zero
    ///     (label <c>domain</c>).
    /// </summary>
    public static readonly Counter<long> RequiredAuditTrailOrphanAlertsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_required_audit_trail_orphan_alerts_total",
            description: "Required audit trail orphan probe alert increments (label domain).");

    /// <summary>
    ///     Startup configuration advisory warnings (label <c>rule_name</c>) — bounded code constants only (TECH_BACKLOG TB-002).
    /// </summary>
    public static readonly Counter<long> StartupConfigWarningsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_startup_config_warnings_total",
            description: "Non-fatal startup configuration warnings (label rule_name).");

    /// <summary>Incremented once per replica when <c>ApplicationStopping</c> begins cooperative drain (TB-961).</summary>
    public static readonly Counter<long> WorkerDrainStartedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_worker_drain_started_total",
            description: "Worker/API host drain started on ApplicationStopping (TB-961).");

    /// <summary>Incremented when host shutdown times out while drain is still active (TB-961).</summary>
    public static readonly Counter<long> WorkerDrainForcedKillTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_worker_drain_forced_kill_total",
            description: "Host shutdown timed out during drain; platform may force-kill the replica (TB-961).");

    /// <summary>Shutdown execute-ownership lease release latency in milliseconds (TB-961).</summary>
    public static readonly Histogram<double> WorkerDrainLeaseReleaseDurationMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid_worker_drain_lease_release_duration_ms",
            "ms",
            "Duration to release execute ownership leases held by this instance during shutdown drain (TB-961).");

    /// <summary>
    ///     Observed latency for named SQL/query gates (TECH_BACKLOG TB-003 parity with CI allowlist; label <c>query_name</c>).
    /// </summary>
    public static readonly Histogram<double> QueryNamedLatencyMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid_query_p95_ms",
            "ms",
            "Latency snapshot for named query performance regression gates (label query_name).");

    /// <summary>Azure OpenAI chat completion prompt (input) tokens.</summary>
    public static readonly Counter<long> LlmPromptTokensTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_prompt_tokens_total",
            description: "Cumulative prompt tokens reported by Azure OpenAI completions.");

    /// <summary>Azure OpenAI chat completion output tokens.</summary>
    public static readonly Counter<long> LlmCompletionTokensTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_completion_tokens_total",
            description: "Cumulative completion tokens reported by Azure OpenAI completions.");

    /// <summary>Azure OpenAI prompt-cache discounted input tokens (TB-681).</summary>
    public static readonly Counter<long> LlmCachedPromptTokensTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_cached_prompt_tokens_total",
            description: "Cumulative cached prompt tokens reported by Azure OpenAI prompt caching.");

    /// <summary>Completed Azure OpenAI Batch API jobs (TB-685).</summary>
    public static readonly Counter<long> LlmBatchJobsCompletedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_batch_jobs_completed_total",
            description: "Cumulative Azure OpenAI Batch API jobs completed for offline LLM paths.");

    /// <summary>Estimated USD savings from Batch API discount on offline LLM paths (TB-685).</summary>
    public static readonly Counter<double> LlmBatchEstimatedSavingsUsdTotal =
        AppMeter.CreateCounter<double>(
            "archlucid_llm_batch_estimated_savings_usd_total",
            description: "Monitoring-grade estimated USD savings from Azure OpenAI Batch API discount on offline paths.");

    /// <summary>Completion token distribution tagged by agent consume role and invoke kind (TB-015).</summary>
    public static readonly Histogram<long> LlmCompletionTokensDimensional =
        AppMeter.CreateHistogram<long>(
            "archlucid.llm.completion_tokens",
            description: "Completion token distribution tagged by archlucid.llm.consume_role and archlucid.llm.invoke_kind.");

    /// <summary>Embedding input tokens reported by Azure OpenAI embeddings (<c>AzureOpenAiEmbeddingClient</c>).</summary>
    public static readonly Counter<long> LlmEmbeddingInputTokensTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_embedding_input_tokens_total",
            description: "Cumulative embedding input tokens from Azure OpenAI (not double-counted with chat prompt tokens).");

    /// <summary>
    ///     End-to-end latency for outbound GenAI operations (chat completions and embedding RPCs; labels
    ///     <c>gen_ai.operation.name</c>, <c>status</c>).
    /// </summary>
    public static readonly Histogram<double> LlmGenAiOperationDurationMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid_llm_gen_ai_operation_duration_ms",
            "ms",
            "Wall time for GenAI client operations (complements HTTP client spans; no prompt or completion text).");

    /// <summary>
    ///     Pre-tax estimated LLM spend counter (label <c>tenant</c>). Monitoring-grade only — not invoice-reconciliation-grade.
    ///     See instrument description for IEEE 754 <c>decimal</c>-to-<c>double</c> rounding caveats (TB-025).
    /// </summary>
    public static readonly Counter<double> LlmCostUsdTotal =
        AppMeter.CreateCounter<double>(
            "archlucid_llm_cost_usd_total",
            "USD",
            "Pre-tax estimated LLM spend in USD from token counts × configured per-million rates (label tenant). Monitoring-grade only — not invoice-reconciliation-grade; the decimal-to-double cast introduces sub-microdollar IEEE 754 rounding. Does not include VAT/GST.");
}
