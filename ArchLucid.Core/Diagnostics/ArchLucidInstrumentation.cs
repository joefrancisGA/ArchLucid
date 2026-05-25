using System.Diagnostics;
using System.Diagnostics.Metrics;

using ArchLucid.Core.Retrieval;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Thread-safe completion count for one <c>RealAgentExecutor.ExecuteAsync</c> batch (parallel handlers share one
///     instance).
/// </summary>
public sealed class AgentExecutionLlmCallAccumulator
{
    private int _count;

    /// <summary>Adds <paramref name="delta" /> successful remote completions (ignored if non-positive).</summary>
    public void AddCompletions(int delta)
    {
        if (delta > 0)

            _ = Interlocked.Add(ref _count, delta);
    }

    /// <summary>Reads and resets the accumulated count.</summary>
    public int Consume()
    {
        return Interlocked.Exchange(ref _count, 0);
    }
}

/// <summary>
///     Shared <see cref="ActivitySource" /> and <see cref="Meter" /> names for cross-cutting observability (OTel wiring in
///     the API host).
/// </summary>
public static class ArchLucidInstrumentation
{
    /// <summary>Maximum characters for optional GenAI span payloads gated by <c>LlmTelemetry:CapturePromptResponseOnSpans</c>.</summary>
    public const int SensitiveGenAiTelemetrySnapshotMaxChars = 65536;

    /// <summary>Meter name registered with OpenTelemetry in <c>AddArchLucidOpenTelemetry</c>.</summary>
    public static string MeterName => ArchLucidMeterNames.Meter;

    private static readonly Meter AppMeter = new(MeterName, "1.0.0");

    private static readonly AsyncLocal<AgentExecutionLlmCallAccumulator?> LlmCallsPerRunAccumulator = new();

    private static int _outboxObservableGaugesRegistered;

    private static int _trialFunnelObservableGaugesRegistered;

    private static int _llmCompletionCacheObservableInstrumentsRegistered;

    private static int _circuitBreakerStateObservableGaugeRegistered;

    private static int _llmTenantBudgetUtilizationObservableGaugeRegistered;

    private static int _llmTenantBudgetRemainingObservableGaugeRegistered;

    private static int _executiveRoiSavingsObservableGaugeRegistered;
    private static long _llmCompletionCacheHitsAggregate;

    private static long _llmCompletionCacheMissesAggregate;

    private static long _hotPathReadCacheHitsAggregate;

    private static long _hotPathReadCacheMissesAggregate;

    private static long _explanationCacheHitsAggregate;

    private static long _explanationCacheMissesAggregate;

    private static long _graphProjectionCacheHitsAggregate;

    private static long _graphProjectionCacheMissesAggregate;

    private static long _trialActiveTenantsCached;

    private static Func<long>? _auditRetryQueuePendingReader;

    private static Func<IReadOnlyList<(string GateName, string State)>>? _circuitBreakerSnapshotReader;

    private static Func<Measurement<double>[]>? _llmBudgetUtilizationReader;

    private static Func<Measurement<double>[]>? _llmBudgetRemainingReader;

    private static Func<Measurement<double>[]>? _executiveRoiSavingsReader;

    private static Func<string, bool>? _firstTenantFunnelEventNameValidator;

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

    /// <summary>Ask path fell back to SQL findings/manifest text when vector retrieval failed.</summary>
    public static readonly Counter<long> RagRetrievalFallbackTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_rag_retrieval_fallback_total",
            description: "Ask retrieval fell back to SQL text search after vector index failure.");

    /// <summary>
    ///     Wall time for vector retrieval search (embed + index query; labels <c>corpus_kind</c> = single kind,
    ///     <c>mixed</c>, or <c>none</c> when empty).
    /// </summary>
    public static readonly Histogram<double> RagRetrievalDurationMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid_rag_retrieval_duration_ms",
            "ms",
            "Wall time for RAG vector retrieval (embed + vector index search).");

    /// <summary>
    ///     Chunks returned per retrieval search grouped by <c>corpus_kind</c> (Improvement 7; histogram not counter
    ///     per assessment spec).
    /// </summary>
    public static readonly Histogram<int> RagChunksRetrieved =
        AppMeter.CreateHistogram<int>(
            "archlucid_rag_chunks_retrieved_total",
            "{chunk}",
            "Number of retrieval chunks returned per vector search (label corpus_kind).");

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

    /// <summary>Successful self-service trial activations (labels: <c>source</c>, <c>mode</c>).</summary>
    public static readonly Counter<long> TrialSignupsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_trial_signups_total",
            description: "Self-service trial funnel: successful trial activations (labels: source, mode).");

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

    /// <summary>Production agent handler completions (label: <c>agent_type_key</c>, <c>outcome</c>=success|error).</summary>
    public static readonly Counter<long> AgentHandlerInvocationsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_agent_handler_invocations_total",
            description: "Agent handler invocations by type and outcome.");

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

    /// <summary>
    ///     DbUp or journal-repair path touched RLS rename migration <c>108_RlsRenameToArchLucid.sql</c> (labels
    ///     <c>migration_id</c>, <c>tenant_scope</c> SQL catalog name, <c>encounter_kind</c>).
    /// </summary>
    public static readonly Counter<long> CatalogMigrationRls108ReplayNotesTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_catalog_migration_rls_108_replay_notes_total",
            description:
            "RLS migration 108 (ArchLucid tenant-scope rename) noted during catalog migration (labels migration_id, tenant_scope, encounter_kind).");

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
    ///     Startup configuration advisory warnings (label <c>rule_name</c>) — bounded code constants only (TECH_BACKLOG TB-002).
    /// </summary>
    public static readonly Counter<long> StartupConfigWarningsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_startup_config_warnings_total",
            description: "Non-fatal startup configuration warnings (label rule_name).");

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
    ///     Estimated LLM spend (USD) from configured per-million token rates on recorded traces (label <c>tenant</c>).
    /// </summary>
    public static readonly Counter<double> LlmCostUsdTotal =
        AppMeter.CreateCounter<double>(
            "archlucid_llm_cost_usd_total",
            "USD",
            "Estimated LLM USD from token counts × AgentExecution:LlmCostEstimation rates (label tenant).");

    /// <summary>Latest outbox depths for <see cref="EnsureOutboxDepthObservableGaugesRegistered" />.</summary>
    public static OutboxDepthGaugeState OutboxDepthGauges
    {
        get;
    } = new();

    /// <summary>
    ///     Supplies pending audit-retry depth for <c>archlucid_audit_retry_queue_pending</c> (last writer wins; use a
    ///     singleton queue).
    /// </summary>
    public static void SetAuditRetryQueuePendingReader(Func<long>? reader)
    {
        Volatile.Write(ref _auditRetryQueuePendingReader, reader);
    }

    public static void SetCircuitBreakerSnapshotReader(Func<IReadOnlyList<(string GateName, string State)>> reader) =>
        Volatile.Write(ref _circuitBreakerSnapshotReader, reader);

    public static void SetLlmBudgetUtilizationReader(Func<Measurement<double>[]> reader) =>
        Volatile.Write(ref _llmBudgetUtilizationReader, reader);

    public static void SetLlmBudgetRemainingReader(Func<Measurement<double>[]> reader) =>
        Volatile.Write(ref _llmBudgetRemainingReader, reader);

    public static void SetExecutiveRoiSavingsReader(Func<Measurement<double>[]> reader) =>
        Volatile.Write(ref _executiveRoiSavingsReader, reader);

    public static void SetFirstTenantFunnelEventNameValidator(Func<string, bool> validator) =>
        Volatile.Write(ref _firstTenantFunnelEventNameValidator, validator);

    /// <summary>Registers observable gauges once (call from OpenTelemetry host setup).</summary>
    public static void EnsureOutboxDepthObservableGaugesRegistered()
    {
        if (Interlocked.Exchange(ref _outboxObservableGaugesRegistered, 1) != 0)
            return;

        OutboxDepthGaugeState s = OutboxDepthGauges;

        AppMeter.CreateObservableGauge(
            "archlucid_authority_pipeline_work_pending",
            () => new Measurement<long>(s.Current.AuthorityPipelineWorkPending),
            description:
            "dbo.AuthorityPipelineWorkOutbox rows eligible for dequeue (excludes dead letters, active leases, backoff window).");

        AppMeter.CreateObservableGauge(
            "archlucid_authority_pipeline_work_dead_letter",
            () => new Measurement<long>(s.Current.AuthorityPipelineWorkDeadLetter),
            description: "dbo.AuthorityPipelineWorkOutbox rows exhausted retries (DeadLetteredUtc set).");

        AppMeter.CreateObservableGauge(
            "archlucid_authority_pipeline_work_oldest_pending_age_seconds",
            () => new Measurement<double>(s.Current.AuthorityPipelineWorkOldestPendingAgeSeconds),
            "s",
            "Age in seconds of the oldest pending authority pipeline work outbox row.");

        AppMeter.CreateObservableGauge(
            "archlucid_retrieval_indexing_outbox_pending",
            () => new Measurement<long>(s.Current.RetrievalIndexingOutboxPending),
            description: "Rows in dbo.RetrievalIndexingOutbox awaiting indexing.");

        AppMeter.CreateObservableGauge(
            "archlucid_retrieval_indexing_outbox_oldest_pending_age_seconds",
            () => new Measurement<double>(s.Current.RetrievalIndexingOutboxOldestPendingAgeSeconds),
            "s",
            "Age in seconds of the oldest pending retrieval indexing outbox row.");

        AppMeter.CreateObservableGauge(
            "archlucid_retrieval_indexing_outbox_dead_lettered_total",
            () => new Measurement<long>(s.Current.RetrievalIndexingOutboxDeadLetter),
            description: "dbo.RetrievalIndexingOutbox rows exhausted retries (DeadLetteredUtc set).");

        AppMeter.CreateObservableGauge(
            "archlucid_integration_event_outbox_publish_pending",
            () => new Measurement<long>(s.Current.IntegrationEventOutboxPublishPending),
            description: "Integration outbox rows eligible for Service Bus publish (excludes dead letters).");

        AppMeter.CreateObservableGauge(
            "archlucid_integration_event_outbox_dead_letter",
            () => new Measurement<long>(s.Current.IntegrationEventOutboxDeadLetter),
            description: "Integration outbox rows in dead-letter state.");

        AppMeter.CreateObservableGauge(
            "archlucid_integration_event_outbox_oldest_actionable_pending_age_seconds",
            () => new Measurement<double>(s.Current.IntegrationEventOutboxOldestActionablePendingAgeSeconds),
            "s",
            "Age in seconds of the oldest actionable integration outbox publish row.");

        AppMeter.CreateObservableGauge(
            "archlucid_audit_retry_queue_pending",
            () => new Measurement<long>(_auditRetryQueuePendingReader?.Invoke() ?? 0),
            description: "Approximate audit events waiting in memory for durable write after hot-path failure.");
    }

    /// <summary>Registers trial funnel observable gauges once (call from OpenTelemetry host setup).</summary>
    public static void EnsureTrialFunnelObservableGaugesRegistered()
    {
        if (Interlocked.Exchange(ref _trialFunnelObservableGaugesRegistered, 1) != 0)
            return;

        AppMeter.CreateObservableGauge(
            "archlucid_trial_active_tenants",
            () => new Measurement<long>(Volatile.Read(ref _trialActiveTenantsCached)),
            description:
            "Tenants currently on an active self-service trial (TrialStatus=Active, TrialExpiresUtc set).");
    }

    /// <summary>
    ///     Registers observable LLM completion cache instruments once (<c>CachingLlmCompletionClient</c>).
    /// </summary>
    public static void EnsureLlmCompletionCacheObservableInstrumentsRegistered()
    {
        if (Interlocked.Exchange(ref _llmCompletionCacheObservableInstrumentsRegistered, 1) != 0)

            return;

        AppMeter.CreateObservableGauge(
            "archlucid_llm_cache_hit_ratio",
            () =>
            {
                long hits = Interlocked.Read(ref _llmCompletionCacheHitsAggregate);
                long misses = Interlocked.Read(ref _llmCompletionCacheMissesAggregate);
                long denominator = hits + misses;

                double ratio = denominator == 0 ? 0 : hits / (double)denominator;

                return new Measurement<double>(ratio);
            },
            description:
            "Process-wide LLM completion cache hit ratio (hits / (hits + misses)) from CachingLlmCompletionClient.");
    }

    /// <summary>
    ///     Registers per-gauge circuit breaker state once (numeric: Closed=0, HalfOpen=1, Open=2; labels <c>gate</c>,
    ///     <c>state</c>).
    /// </summary>
    public static void EnsureCircuitBreakerStateObservableGaugesRegistered()
    {
        if (Interlocked.Exchange(ref _circuitBreakerStateObservableGaugeRegistered, 1) != 0)
            return;

        AppMeter.CreateObservableGauge(
            "archlucid_circuit_breaker_state",
            static () =>
            {
                IReadOnlyList<(string GateName, string State)> snaps = _circuitBreakerSnapshotReader?.Invoke() ?? Array.Empty<(string, string)>();
                Measurement<int>[] measurements = new Measurement<int>[snaps.Count];

                for (int i = 0; i < snaps.Count; i++)
                {
                    (string gateName, string state) = snaps[i];
                    int n = state switch
                    {
                        "Open" => 2,
                        "HalfOpen" => 1,
                        _ => 0
                    };
                    measurements[i] = new Measurement<int>(
                        n,
                        new KeyValuePair<string, object?>("gate", gateName),
                        new KeyValuePair<string, object?>("state", state));
                }

                return measurements;
            },
            description:
            "Circuit breaker state per gate (0=Closed,1=HalfOpen,2=Open) with string state tag (OpenAI gates).");
    }

    /// <summary>Registers observable per-tenant UTC-month LLM budget utilization fractions (collector updates snapshots on a ≥5 min cadence).</summary>
    public static void EnsureLlmTenantBudgetUtilizationObservableGaugeRegistered()
    {
        if (Interlocked.Exchange(ref _llmTenantBudgetUtilizationObservableGaugeRegistered, 1) != 0)
            return;

        AppMeter.CreateObservableGauge(
            "archlucid_llm_budget_utilization_fraction",
            () => _llmBudgetUtilizationReader?.Invoke() ?? Array.Empty<Measurement<double>>(),
            description:
            "UTC-month LLM dollar utilization (CommittedUsd+ReservedUsd over configured hard cutoff + purchased bump; label tenant_id).");
    }

    /// <summary>Registers observable per-tenant UTC-month LLM budget USD remaining under the effective hard cap (collector updates alongside utilization).</summary>
    public static void EnsureLlmTenantBudgetRemainingUsdObservableGaugeRegistered()
    {
        if (Interlocked.Exchange(ref _llmTenantBudgetRemainingObservableGaugeRegistered, 1) != 0)
            return;

        AppMeter.CreateObservableGauge(
            "archlucid_llm_budget_remaining_usd",
            () => _llmBudgetRemainingReader?.Invoke() ?? Array.Empty<Measurement<double>>(),
            "USD",
            "UTC-month LLM dollar headroom remaining under hard cutoff + purchased bump (non-negative; label tenant_id).");
    }

    /// <summary>Registers observable executive ROI savings gauge (platform aggregate + optional per-tenant rows).</summary>
    public static void EnsureExecutiveRoiSavingsObservableGaugeRegistered()
    {
        if (Interlocked.Exchange(ref _executiveRoiSavingsObservableGaugeRegistered, 1) != 0)
            return;

        AppMeter.CreateObservableGauge(
            "archlucid_tenant_estimated_savings_usd",
            () => _executiveRoiSavingsReader?.Invoke() ?? Array.Empty<Measurement<double>>(),
            "USD",
            "Estimated USD savings rollup from Executive ROI dedup rules. Labels: scope=platform|tenant; tenant_id when scope=tenant.");
    }

    /// <summary>Updates the cached value read by <c>archlucid_trial_active_tenants</c> (background metrics collector).</summary>
    public static void PublishTrialActiveTenantCount(long count)
    {
        if (count < 0)

            count = 0;

        Volatile.Write(ref _trialActiveTenantsCached, count);
    }

    /// <summary>Records one pricing quote request age observation for SLA histogram export.</summary>
    public static void RecordPricingQuoteRequestAgeHours(double ageHours, string breachStatus)
    {
        if (ageHours < 0)
            ageHours = 0;

        if (string.IsNullOrWhiteSpace(breachStatus))
            breachStatus = "unknown";

        KeyValuePair<string, object?>[] tags =
        [
            new KeyValuePair<string, object?>("breach_status", breachStatus)
        ];

        PricingQuoteRequestAgeHours.Record(ageHours, tags.AsSpan());
    }

    /// <summary>
    ///     Associates <paramref name="accumulator" /> with the current async flow so the agent host&apos;s completion client
    ///     can count remote completions toward <see cref="LlmCallsPerRun" />. Dispose to detach.
    /// </summary>
    public static IDisposable BeginLlmCallsPerRunAccumulation(AgentExecutionLlmCallAccumulator accumulator)
    {
        ArgumentNullException.ThrowIfNull(accumulator);

        LlmCallsPerRunAccumulator.Value = accumulator;

        return new LlmCallsPerRunAccumulationScope();
    }

    /// <summary>Increments the current batch&apos;s LLM completion count when an accumulator scope is active.</summary>
    public static void RecordLlmCompletionCallForCurrentRunBatch()
    {
        AgentExecutionLlmCallAccumulator? acc = LlmCallsPerRunAccumulator.Value;

        acc?.AddCompletions(1);
    }

    /// <summary>Records one LLM completion response cache hit (label <c>agent_type</c>).</summary>
    public static void RecordLlmCompletionCacheHit(string agentType)
    {
        string label = string.IsNullOrWhiteSpace(agentType) ? "unknown" : agentType.Trim();

        _ = Interlocked.Increment(ref _llmCompletionCacheHitsAggregate);

        TagList tags = [];
        tags.Add("agent_type", label);

        LlmCompletionCacheHitsTotal.Add(1, tags);
    }

    /// <summary>Records one LLM completion response cache miss (label <c>agent_type</c>).</summary>
    public static void RecordLlmCompletionCacheMiss(string agentType)
    {
        string label = string.IsNullOrWhiteSpace(agentType) ? "unknown" : agentType.Trim();

        _ = Interlocked.Increment(ref _llmCompletionCacheMissesAggregate);

        TagList tags = [];
        tags.Add("agent_type", label);

        LlmCompletionCacheMissesTotal.Add(1, tags);
    }

    /// <summary>Records one hot-path read cache hit (<c>IHotPathReadCache</c> / HybridCache).</summary>
    public static void RecordHotPathReadCacheHit()
    {
        _ = Interlocked.Increment(ref _hotPathReadCacheHitsAggregate);
    }

    /// <summary>Records one hot-path read cache miss (factory invoked).</summary>
    public static void RecordHotPathReadCacheMiss()
    {
        _ = Interlocked.Increment(ref _hotPathReadCacheMissesAggregate);
    }

    /// <summary>Records one aggregate explanation cache hit.</summary>
    public static void RecordExplanationCacheHit()
    {
        _ = Interlocked.Increment(ref _explanationCacheHitsAggregate);
        ExplanationCacheHits.Add(1);
    }

    /// <summary>Records one aggregate explanation cache miss.</summary>
    public static void RecordExplanationCacheMiss()
    {
        _ = Interlocked.Increment(ref _explanationCacheMissesAggregate);
        ExplanationCacheMisses.Add(1);
    }

    /// <summary>Records one Ask SQL retrieval fallback after vector search failure.</summary>
    public static void RecordRagRetrievalFallback()
    {
        RagRetrievalFallbackTotal.Add(1);
    }

    /// <summary>
    ///     Records RAG vector search latency and per-<paramref name="hits" /> corpus chunk counts (Improvement 7).
    ///     Omits <c>tenant_id</c> tags by default (high cardinality); callers pass <paramref name="recordPerTenant" />
    ///     only for bounded tenant counts.
    /// </summary>
    public static void RecordRagRetrievalSearch(
        double durationMilliseconds,
        IReadOnlyList<RetrievalHit> hits,
        Guid tenantId,
        bool recordPerTenant = false)
    {
        if (durationMilliseconds < 0 || double.IsNaN(durationMilliseconds) || double.IsInfinity(durationMilliseconds))
            return;

        string corpusKindLabel = ResolveRagRetrievalCorpusKindLabel(hits);

        TagList durationTags = new() { { "corpus_kind", corpusKindLabel } };

        if (recordPerTenant && tenantId != Guid.Empty)
            durationTags.Add("tenant_id", tenantId.ToString("D"));

        RagRetrievalDurationMilliseconds.Record(durationMilliseconds, durationTags);

        if (hits is null || hits.Count == 0)
        {
            TagList emptyTags = new() { { "corpus_kind", "none" } };

            if (recordPerTenant && tenantId != Guid.Empty)
                emptyTags.Add("tenant_id", tenantId.ToString("D"));

            RagChunksRetrieved.Record(0, emptyTags);

            return;
        }

        Dictionary<string, int> countsByCorpus = new(StringComparer.Ordinal);

        foreach (RetrievalHit hit in hits)
        {
            if (hit is null)
                continue;

            string kind = string.IsNullOrWhiteSpace(hit.CorpusKind) ? "unknown" : hit.CorpusKind.Trim();

            countsByCorpus.TryGetValue(kind, out int existing);
            countsByCorpus[kind] = existing + 1;
        }

        foreach (KeyValuePair<string, int> pair in countsByCorpus)
        {
            TagList chunkTags = new() { { "corpus_kind", pair.Key } };

            if (recordPerTenant && tenantId != Guid.Empty)
                chunkTags.Add("tenant_id", tenantId.ToString("D"));

            RagChunksRetrieved.Record(pair.Value, chunkTags);
        }
    }

    /// <summary>Increments <see cref="IntegrationEventDeliverySuccessTotal" />.</summary>
    public static void RecordIntegrationEventDeliverySuccess(string eventType)
    {
        string e = string.IsNullOrWhiteSpace(eventType) ? "unknown" : eventType.Trim();
        IntegrationEventDeliverySuccessTotal.Add(1, new TagList { { "event_type", e } });
    }

    /// <summary>Increments <see cref="IntegrationEventDeliveryFailedTotal" />.</summary>
    public static void RecordIntegrationEventDeliveryFailure(string eventType)
    {
        string e = string.IsNullOrWhiteSpace(eventType) ? "unknown" : eventType.Trim();
        IntegrationEventDeliveryFailedTotal.Add(1, new TagList { { "event_type", e } });
    }

    private static string ResolveRagRetrievalCorpusKindLabel(IReadOnlyList<RetrievalHit>? hits)
    {
        if (hits is null || hits.Count == 0)
            return "none";

        HashSet<string> kinds = new(StringComparer.Ordinal);

        foreach (RetrievalHit hit in hits)
        {
            if (hit is null)
                continue;

            string kind = string.IsNullOrWhiteSpace(hit.CorpusKind) ? "unknown" : hit.CorpusKind.Trim();
            kinds.Add(kind);
        }

        if (kinds.Count == 0)
            return "none";

        if (kinds.Count == 1)
            return kinds.First();

        return "mixed";
    }

    /// <summary>Records one graph snapshot projection cache hit.</summary>
    public static void RecordGraphProjectionCacheHit()
    {
        _ = Interlocked.Increment(ref _graphProjectionCacheHitsAggregate);
    }

    /// <summary>Records one graph snapshot projection cache miss.</summary>
    public static void RecordGraphProjectionCacheMiss()
    {
        _ = Interlocked.Increment(ref _graphProjectionCacheMissesAggregate);
    }

    /// <summary>Returns process-life cache counters for operator diagnostics.</summary>
    public static CacheTelemetrySnapshot GetCacheTelemetrySnapshot()
    {
        return new CacheTelemetrySnapshot
        {
            HotPathReadCacheHits = Interlocked.Read(ref _hotPathReadCacheHitsAggregate),
            HotPathReadCacheMisses = Interlocked.Read(ref _hotPathReadCacheMissesAggregate),
            ExplanationCacheHits = Interlocked.Read(ref _explanationCacheHitsAggregate),
            ExplanationCacheMisses = Interlocked.Read(ref _explanationCacheMissesAggregate),
            LlmCompletionCacheHits = Interlocked.Read(ref _llmCompletionCacheHitsAggregate),
            LlmCompletionCacheMisses = Interlocked.Read(ref _llmCompletionCacheMissesAggregate),
            GraphProjectionCacheHits = Interlocked.Read(ref _graphProjectionCacheHitsAggregate),
            GraphProjectionCacheMisses = Interlocked.Read(ref _graphProjectionCacheMissesAggregate),
        };
    }

    /// <summary>
    ///     Records a successful completion that used the secondary fallback client (label <c>deployment</c> from primary
    ///     descriptor).
    /// </summary>
    public static void RecordLlmCompletionFallbackEngaged(string deploymentLabel)
    {
        string label = string.IsNullOrWhiteSpace(deploymentLabel) ? "unknown" : deploymentLabel.Trim();

        TagList tags = [];
        tags.Add("deployment", label);

        LlmCompletionFallbackEngagementsTotal.Add(1, tags);
    }

    /// <summary>Increments <c>archlucid.try.real_mode.attempted_total</c>.</summary>
    public static void RecordTryRealModePilotAttempted() => TryRealModeAttemptedTotal.Add(1);

    /// <summary>Increments <c>archlucid.try.real_mode.succeeded_total</c>.</summary>
    public static void RecordTryRealModePilotSucceeded() => TryRealModeSucceededTotal.Add(1);

    /// <summary>Increments <c>archlucid.try.real_mode.fellback_to_simulator_total</c>.</summary>
    public static void RecordTryRealModePilotFellBackToSimulator() => TryRealModeFellBackToSimulatorTotal.Add(1);

    /// <summary>Increments <c>archlucid_finding_engine_failures_total</c>.</summary>
    public static void RecordFindingEngineFailure(string engineType, string category)
    {
        TagList tags = new() { { "engine_type", engineType }, { "category", category } };

        FindingEngineFailuresTotal.Add(1, tags);
    }

    /// <summary>Increments <c>archlucid_agent_result_schema_validations_total</c> (outcome: valid or invalid).</summary>
    public static void RecordAgentResultSchemaValidation(string agentType, string outcome)
    {
        TagList tags = new() { { "agent_type", agentType }, { "outcome", outcome } };

        AgentResultSchemaValidationsTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="AgentSchemaRemediationRetriesTotal" />.</summary>
    public static void RecordAgentSchemaRemediationRetry(string agentTypeLabel)
    {
        string t = string.IsNullOrWhiteSpace(agentTypeLabel) ? "unknown" : agentTypeLabel.Trim();
        TagList tags = new() { { "agent_type", t } };

        AgentSchemaRemediationRetriesTotal.Add(1, tags);
    }

    /// <summary>Increments <c>archlucid_explanation_schema_validations_total</c> (outcome: valid, invalid, or skipped).</summary>
    public static void RecordExplanationSchemaValidation(string explanationType, string outcome)
    {
        TagList tags = new() { { "explanation_type", explanationType }, { "outcome", outcome } };

        ExplanationSchemaValidationsTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="ExplanationRetrySuccessTotal" />.</summary>
    public static void RecordExplanationRetrySuccess(string explanationType)
    {
        string type = string.IsNullOrWhiteSpace(explanationType) ? "unknown" : explanationType.Trim();
        TagList tags = new() { { "explanation_type", type } };

        ExplanationRetrySuccessTotal.Add(1, tags);
    }

    /// <summary>Records <see cref="ExplanationFaithfulnessRatio" /> (clamped 0–1).</summary>
    public static void RecordExplanationFaithfulnessRatio(double ratio)
    {
        double clamped = Math.Clamp(ratio, 0.0, 1.0);
        ExplanationFaithfulnessRatio.Record(clamped);
    }

    /// <summary>Records <see cref="RetrievalFaithfulnessRatio" /> (clamped 0–1).</summary>
    public static void RecordRetrievalFaithfulnessRatio(double ratio)
    {
        double clamped = Math.Clamp(ratio, 0.0, 1.0);
        RetrievalFaithfulnessRatio.Record(clamped);
    }

    /// <summary>Increments <see cref="TrialSignupsTotal" />.</summary>
    public static void RecordTrialSignup(string source, string mode)
    {
        TagList tags = new()
        {
            { "source", string.IsNullOrWhiteSpace(source) ? "unknown" : source.Trim() },
            { "mode", string.IsNullOrWhiteSpace(mode) ? "unknown" : mode.Trim() }
        };

        TrialSignupsTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="TrialSignupFailuresTotal" />.</summary>
    public static void RecordTrialSignupFailure(string stage, string reason)
    {
        TagList tags = new()
        {
            { "stage", string.IsNullOrWhiteSpace(stage) ? "unknown" : stage.Trim() },
            { "reason", string.IsNullOrWhiteSpace(reason) ? "unknown" : reason.Trim() }
        };

        TrialSignupFailuresTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="TrialFunnelHealthProbeTotal" /> (label: <c>outcome</c> success|failure).</summary>
    public static void RecordTrialFunnelHealthProbe(string outcome)
    {
        string o = string.IsNullOrWhiteSpace(outcome) ? "unknown" : outcome.Trim();
        if (o is not ("success" or "failure"))
            o = "unknown";
        TagList tags = new() { { "outcome", o } };
        TrialFunnelHealthProbeTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="TrialRegistrationFailuresTotal" /> (label: <c>reason</c> validation|conflict|internal).</summary>
    public static void RecordTrialRegistrationFailure(string reason)
    {
        string r = string.IsNullOrWhiteSpace(reason) ? "unknown" : reason.Trim();
        if (r is not ("validation" or "conflict" or "internal"))
            r = "unknown";
        TagList tags = new() { { "reason", r } };
        TrialRegistrationFailuresTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="TrialSignupBaselineSkippedTotal" /> (model-default baseline path at signup).</summary>
    public static void RecordTrialSignupBaselineSkipped()
    {
        TrialSignupBaselineSkippedTotal.Add(1);
    }

    /// <summary>Increments <see cref="BaselineManualPrepCapturedTotal" />.</summary>
    public static void RecordBaselineManualPrepCaptured()
    {
        BaselineManualPrepCapturedTotal.Add(1);
    }

    /// <summary>Records <see cref="TrialFirstRunSeconds" /> when positive and finite.</summary>
    public static void RecordTrialFirstRunLatencySeconds(double seconds)
    {
        if (seconds <= 0 || double.IsNaN(seconds) || double.IsInfinity(seconds))
            return;

        TrialFirstRunSeconds.Record(seconds);
    }

    /// <summary>
    ///     Records <see cref="TenantTimeToFirstCommitSeconds" /> for the first successful manifest pin (any tenant).
    /// </summary>
    public static void RecordTenantTimeToFirstCommitSeconds(double seconds, string tenantKind)
    {
        if (seconds <= 0 || double.IsNaN(seconds) || double.IsInfinity(seconds))
            return;

        string k = string.IsNullOrWhiteSpace(tenantKind) ? "unknown" : tenantKind.Trim();

        if (k is not ("trial" or "non_trial"))
            k = "unknown";

        TenantTimeToFirstCommitSeconds.Record(seconds, new TagList { { "tenant_kind", k } });
    }

    /// <summary>Records <see cref="TrialRunsUsedRatio" /> clamped to non-negative values.</summary>
    public static void RecordTrialRunsUsedRatio(double ratio)
    {
        if (double.IsNaN(ratio) || double.IsInfinity(ratio))
            return;

        TrialRunsUsedRatio.Record(Math.Max(0, ratio));
    }

    /// <summary>Increments <see cref="TrialConversionTotal" />.</summary>
    public static void RecordTrialConversion(string fromState, string toTier)
    {
        TagList tags = new()
        {
            { "from_state", string.IsNullOrWhiteSpace(fromState) ? "unknown" : fromState.Trim() },
            { "to_tier", string.IsNullOrWhiteSpace(toTier) ? "unknown" : toTier.Trim() }
        };

        TrialConversionTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="TrialExpirationsTotal" />.</summary>
    public static void RecordTrialExpiration(string reason)
    {
        string r = string.IsNullOrWhiteSpace(reason) ? "unknown" : reason.Trim();
        TagList tags = new() { { "reason", r } };

        TrialExpirationsTotal.Add(1, tags);
    }

    private static readonly HashSet<string> TrialUpgradeNudgeTriggers =
        new(StringComparer.Ordinal) { "runs", "seats", "expiry" };

    /// <summary>Increments <see cref="TrialUpgradeNudgeShownTotal" />.</summary>
    public static void RecordTrialUpgradeNudgeShown(string trigger)
    {
        string t = NormalizeTrialUpgradeNudgeTrigger(trigger);
        TrialUpgradeNudgeShownTotal.Add(1, new TagList { { "trigger", t } });
    }

    /// <summary>Increments <see cref="TrialUpgradeNudgeClickedTotal" />.</summary>
    public static void RecordTrialUpgradeNudgeClicked(string trigger)
    {
        string t = NormalizeTrialUpgradeNudgeTrigger(trigger);
        TrialUpgradeNudgeClickedTotal.Add(1, new TagList { { "trigger", t } });
    }

    private static string NormalizeTrialUpgradeNudgeTrigger(string trigger)
    {
        string t = string.IsNullOrWhiteSpace(trigger) ? "unknown" : trigger.Trim();

        return TrialUpgradeNudgeTriggers.Contains(t) ? t : "unknown";
    }

    private static readonly HashSet<string> TeamExpansionNudgeTriggers =
        new(StringComparer.Ordinal) { "seats", "workspaces" };

    /// <summary>Increments <see cref="TeamExpansionNudgeShownTotal" />.</summary>
    public static void RecordTeamExpansionNudgeShown(string trigger)
    {
        string t = NormalizeTeamExpansionNudgeTrigger(trigger);
        TeamExpansionNudgeShownTotal.Add(1, new TagList { { "trigger", t } });
    }

    /// <summary>Increments <see cref="TeamExpansionNudgeClickedTotal" />.</summary>
    public static void RecordTeamExpansionNudgeClicked(string trigger)
    {
        string t = NormalizeTeamExpansionNudgeTrigger(trigger);
        TeamExpansionNudgeClickedTotal.Add(1, new TagList { { "trigger", t } });
    }

    private static string NormalizeTeamExpansionNudgeTrigger(string trigger)
    {
        string t = string.IsNullOrWhiteSpace(trigger) ? "unknown" : trigger.Trim();

        return TeamExpansionNudgeTriggers.Contains(t) ? t : "unknown";
    }

    /// <summary>Increments <see cref="SponsorBannerFirstCommitBadgeRenderedTotal" />.</summary>
    public static void RecordSponsorBannerFirstCommitBadgeRendered(Guid tenantId, string daysSinceFirstCommitBucket)
    {
        string bucket = string.IsNullOrWhiteSpace(daysSinceFirstCommitBucket)
            ? "unknown"
            : daysSinceFirstCommitBucket.Trim();
        TagList tags = new() { { "tenant_id", tenantId.ToString("D") }, { "days_since_first_commit_bucket", bucket } };

        SponsorBannerFirstCommitBadgeRenderedTotal.Add(1, tags);
    }

    private static readonly string[] CorePilotRailChecklistSteps =
        ["create_request", "track_review", "finalize_review_package", "review_outputs"];

    /// <summary>Increments <see cref="CorePilotRailChecklistStepsTotal" /> for checklist step indices 0–3 inclusive.</summary>
    public static void RecordCorePilotRailChecklistStep(int stepIndex)
    {
        if (stepIndex < 0 || stepIndex >= CorePilotRailChecklistSteps.Length)
            throw new ArgumentOutOfRangeException(
                nameof(stepIndex),
                stepIndex,
                $"stepIndex must be 0..{CorePilotRailChecklistSteps.Length - 1}");

        TagList tags = new() { { "step", CorePilotRailChecklistSteps[stepIndex] } };

        CorePilotRailChecklistStepsTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="FirstSessionCompletedTotal" /> once per tenant (caller must gate).</summary>
    public static void RecordFirstSessionCompleted()
    {
        FirstSessionCompletedTotal.Add(1);
    }

    /// <summary>Increments <see cref="AuditWriteFailuresTotal" /> (label <c>event_type</c>).</summary>
    public static void RecordAuditWriteFailure(string eventType)
    {
        string e = string.IsNullOrWhiteSpace(eventType) ? "unknown" : eventType.Trim();
        AuditWriteFailuresTotal.Add(1, new TagList { { "event_type", e } });
    }

    /// <summary>
    ///     Increments <see cref="StartupConfigWarningsTotal"/> once per distinct advisory emission (TECH_BACKLOG TB-002).
    /// </summary>
    public static void RecordStartupConfigWarning(string ruleName)
    {
        string r = string.IsNullOrWhiteSpace(ruleName) ? "unknown" : ruleName.Trim();
        StartupConfigWarningsTotal.Add(1, new TagList { { "rule_name", r } });
    }

    /// <summary>
    ///     Increments <see cref="CatalogMigrationRls108ReplayNotesTotal" />. <paramref name="tenantScope" /> should be
    ///     the SQL catalog name (e.g. <see cref="Microsoft.Data.SqlClient.SqlConnection.Database" />).
    /// </summary>
    public static void RecordCatalogMigrationRls108ReplayNote(
        string migrationId,
        string tenantScope,
        string encounterKind)
    {
        string m = string.IsNullOrWhiteSpace(migrationId) ? "unknown" : migrationId.Trim();
        string scope = string.IsNullOrWhiteSpace(tenantScope) ? "unknown" : tenantScope.Trim();
        string k = string.IsNullOrWhiteSpace(encounterKind) ? "unknown" : encounterKind.Trim();

        TagList tags = new()
        {
            { "migration_id", m },
            { "tenant_scope", scope },
            { "encounter_kind", k },
        };

        CatalogMigrationRls108ReplayNotesTotal.Add(1, tags);
    }

    /// <summary>Records a latency observation for TB-003 allowlisted queries (production or CI ingest).</summary>
    public static void RecordNamedQueryLatencyMilliseconds(string queryName, double milliseconds)
    {
        string q = string.IsNullOrWhiteSpace(queryName) ? "unknown" : queryName.Trim();
        QueryNamedLatencyMilliseconds.Record(milliseconds, new TagList { { "query_name", q } });
    }

    /// <summary>
    ///     Increments <see cref="FirstTenantFunnelEventsTotal" />. <paramref name="eventName" /> must be one of
    ///     <see cref="FirstTenantFunnelEventNames" />. <paramref name="tenantIdNormalized" /> is added as a
    ///     <c>tenant_id</c> tag <b>only</b> when <paramref name="recordPerTenant" /> is true (owner-only flag
    ///     per pending question 40). Never tags <c>userId</c>, IP, or any other personal data.
    /// </summary>
    public static void RecordFirstTenantFunnelEvent(
        string eventName,
        bool recordPerTenant,
        string? tenantIdNormalized)
    {
        if (_firstTenantFunnelEventNameValidator != null && !_firstTenantFunnelEventNameValidator(eventName))
            throw new ArgumentOutOfRangeException(
                nameof(eventName),
                eventName,
                "eventName must be one of the known FirstTenantFunnelEventNames constants.");

        TagList tags = new() { { "event", eventName } };

        if (recordPerTenant && !string.IsNullOrEmpty(tenantIdNormalized))

            tags.Add("tenant_id", tenantIdNormalized);

        FirstTenantFunnelEventsTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="OperatorTaskSuccessTotal" /> for a low-cardinality <paramref name="task" /> label.</summary>
    public static void RecordOperatorTaskSuccess(string task)
    {
        string t = string.IsNullOrWhiteSpace(task) ? "unknown" : task.Trim();
        if (t is not ("first_run_committed" or "first_session_completed"))
            throw new ArgumentOutOfRangeException(nameof(task),
                "task must be first_run_committed or first_session_completed.");

        TagList tags = new() { { "task", t } };

        OperatorTaskSuccessTotal.Add(1, tags);
    }

    /// <summary>Records <see cref="LlmPromptRedactionsTotal" /> for a category bucket.</summary>
    public static void RecordLlmPromptRedactions(string category, int matchCount)
    {
        if (matchCount <= 0)
            return;

        string c = string.IsNullOrWhiteSpace(category) ? "unknown" : category.Trim();
        TagList tags = new() { { "category", c } };

        LlmPromptRedactionsTotal.Add(matchCount, tags);
    }

    /// <summary>Increments <see cref="LlmPromptRedactionSkippedTotal" /> when redaction is disabled.</summary>
    public static void RecordLlmPromptRedactionSkipped(int count = 1)
    {
        if (count <= 0)
            return;

        LlmPromptRedactionSkippedTotal.Add(count);
    }

    /// <summary>Increments <see cref="BillingCheckoutsTotal" />.</summary>
    public static void RecordBillingCheckout(string provider, string tier, string outcome)
    {
        TagList tags = new()
        {
            { "provider", string.IsNullOrWhiteSpace(provider) ? "unknown" : provider.Trim() },
            { "tier", string.IsNullOrWhiteSpace(tier) ? "unknown" : tier.Trim() },
            { "outcome", string.IsNullOrWhiteSpace(outcome) ? "unknown" : outcome.Trim() }
        };

        BillingCheckoutsTotal.Add(1, tags);
    }

    /// <summary>Adds <paramref name="estimatedCostUsd" /> to <see cref="LlmCostUsdTotal" /> when positive.</summary>
    public static void RecordLlmCostUsd(decimal estimatedCostUsd, string? tenantLabel)
    {
        if (estimatedCostUsd <= 0m)
            return;

        string tenant = string.IsNullOrWhiteSpace(tenantLabel) ? "unknown" : tenantLabel.Trim();
        TagList tags = new() { { "tenant", tenant } };

        LlmCostUsdTotal.Add((double)estimatedCostUsd, tags);
    }

    /// <summary>
    ///     Records LLM token counters. When <paramref name="recordPerTenant" /> is true, also emits tagged series with
    ///     <c>tenant_id</c> (increases Prometheus cardinality — use only for bounded tenant counts).
    ///     Optional <paramref name="llmProviderId" /> and <paramref name="llmDeploymentLabel" /> add low-cardinality series
    ///     for FinOps dashboards.
    /// </summary>
    public static void RecordLlmTokenUsage(
        long promptTokens,
        long completionTokens,
        bool recordPerTenant,
        string? tenantIdNormalized,
        string? llmProviderId = null,
        string? llmDeploymentLabel = null)
    {
        bool hasTags = (recordPerTenant && !string.IsNullOrEmpty(tenantIdNormalized))
                       || !string.IsNullOrEmpty(llmProviderId)
                       || !string.IsNullOrEmpty(llmDeploymentLabel);

        if (promptTokens > 0)
            if (hasTags)
                LlmPromptTokensTotal.Add(promptTokens, BuildTags());
            else
                LlmPromptTokensTotal.Add(promptTokens);

        if (completionTokens <= 0)
            return;

        if (hasTags)
            LlmCompletionTokensTotal.Add(completionTokens, BuildTags());
        else
            LlmCompletionTokensTotal.Add(completionTokens);

        return;

        TagList BuildTags()
        {
            TagList tags = [];

            if (recordPerTenant && !string.IsNullOrEmpty(tenantIdNormalized))
                tags.Add("tenant_id", tenantIdNormalized);

            if (!string.IsNullOrEmpty(llmProviderId))

                tags.Add("llm_provider", llmProviderId);

            if (!string.IsNullOrEmpty(llmDeploymentLabel))
                tags.Add("llm_deployment", llmDeploymentLabel);

            return tags;
        }
    }

    /// <summary>Records orchestrator state transitions on the active trace and Prometheus counter.</summary>
    public static void RecordOrchestratorStateTransition(Guid runId, string fromState, string toState)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(fromState);
        ArgumentException.ThrowIfNullOrWhiteSpace(toState);

        TagList tags = new();
        tags.Add("from_state", fromState);
        tags.Add("to_state", toState);
        OrchestratorTransitionTotal.Add(1, tags);

        Activity? activity = Activity.Current;

        if (activity is null)
            return;

        activity.AddEvent(
            new ActivityEvent(
                "orchestrator.state_transition",
                tags: new ActivityTagsCollection
                {
                    { "archlucid.run_id", runId.ToString("D") },
                    { "from_state", fromState },
                    { "to_state", toState },
                }));
    }

    /// <summary>Increments embedding input-token counter (orthogonal to chat <see cref="RecordLlmTokenUsage" />).</summary>
    public static void RecordLlmEmbeddingInputTokens(long inputTokens, string? llmDeploymentLabel)
    {
        if (inputTokens <= 0)
            return;

        if (string.IsNullOrWhiteSpace(llmDeploymentLabel))
        {
            LlmEmbeddingInputTokensTotal.Add(inputTokens);

            return;
        }

        TagList tags = new() { { "llm_deployment", llmDeploymentLabel.Trim() } };

        LlmEmbeddingInputTokensTotal.Add(inputTokens, tags);
    }

    /// <summary>
    ///     Records <see cref="LlmGenAiOperationDurationMilliseconds" /> for chat or embeddings (low-cardinality
    ///     <paramref name="operationName" />: <c>chat</c> or <c>embeddings</c>).
    /// </summary>
    public static void RecordLlmGenAiOperationDurationMilliseconds(
        string operationName,
        double durationMilliseconds,
        bool succeeded)
    {
        string op = string.IsNullOrWhiteSpace(operationName) ? "unknown" : operationName.Trim();

        if (op is not ("chat" or "embeddings"))
            throw new ArgumentOutOfRangeException(
                nameof(operationName),
                operationName,
                "operationName must be chat or embeddings.");

        if (durationMilliseconds < 0 || double.IsNaN(durationMilliseconds) || double.IsInfinity(durationMilliseconds))
            return;

        TagList tags = new()
        {
            { "gen_ai.operation.name", op },
            { "status", succeeded ? "ok" : "error" }
        };

        LlmGenAiOperationDurationMilliseconds.Record(durationMilliseconds, tags);
    }

    private readonly struct LlmCallsPerRunAccumulationScope : IDisposable
    {
        public void Dispose()
        {
            LlmCallsPerRunAccumulator.Value = null;
        }
    }
}
