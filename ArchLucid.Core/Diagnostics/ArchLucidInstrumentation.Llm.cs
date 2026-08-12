using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     LLM usage telemetry: token counters, estimated USD spend, batch/offline paths, GenAI latency, prompt redaction,
///     and per-run completion accumulation.
/// </summary>
/// <remarks>
///     Instrument field declarations for this subsystem live in this partial.
/// </remarks>
public static partial class ArchLucidInstrumentation
{
    // Instrument catalog

    
    /// <summary>Half-open probe results (labels: <c>gate</c>, <c>outcome</c>=success|failure|cancelled).</summary>
    public static readonly Counter<long> CircuitBreakerProbeOutcomes =
        AppMeter.CreateCounter<long>(
            "archlucid_circuit_breaker_probe_outcomes_total",
            description: "Half-open probe results (labels: gate, outcome=success|failure|cancelled).");

    
    /// <summary>Calls rejected while open or while a half-open probe is in flight (label: <c>gate</c>).</summary>
    public static readonly Counter<long> CircuitBreakerRejections =
        AppMeter.CreateCounter<long>(
            "archlucid_circuit_breaker_rejections_total",
            description: "Calls rejected because the circuit was open or a probe was in flight (label: gate).");

    
    /// <summary>Circuit breaker state changes (labels: <c>gate</c>, <c>from_state</c>, <c>to_state</c>).</summary>
    public static readonly Counter<long> CircuitBreakerStateTransitions =
        AppMeter.CreateCounter<long>(
            "archlucid_circuit_breaker_state_transitions_total",
            description: "Circuit breaker state transitions (labels: gate, from_state, to_state).");

    
    /// <summary>Estimated USD savings from Batch API discount on offline LLM paths (TB-685).</summary>
    public static readonly Counter<double> LlmBatchEstimatedSavingsUsdTotal =
        AppMeter.CreateCounter<double>(
            "archlucid_llm_batch_estimated_savings_usd_total",
            description: "Monitoring-grade estimated USD savings from Azure OpenAI Batch API discount on offline paths.");

    
    /// <summary>Completed Azure OpenAI Batch API jobs (TB-685).</summary>
    public static readonly Counter<long> LlmBatchJobsCompletedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_batch_jobs_completed_total",
            description: "Cumulative Azure OpenAI Batch API jobs completed for offline LLM paths.");

    
    /// <summary>Azure OpenAI prompt-cache discounted input tokens (TB-681).</summary>
    public static readonly Counter<long> LlmCachedPromptTokensTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_cached_prompt_tokens_total",
            description: "Cumulative cached prompt tokens reported by Azure OpenAI prompt caching.");

    
    /// <summary>
    ///     LLM call retry attempts before the circuit breaker records a failure (labels: <c>gate</c>, <c>attempt</c>,
    ///     <c>exception_type</c>).
    /// </summary>
    public static readonly Counter<long> LlmCallRetries =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_call_retries_total",
            description:
            "LLM call retry attempts before circuit breaker recording (labels: gate, attempt, exception_type).");

    
    /// <summary>LLM completion calls made during a single <c>RealAgentExecutor.ExecuteAsync</c> batch.</summary>
    public static readonly Histogram<int> LlmCallsPerRun =
        AppMeter.CreateHistogram<int>(
            "archlucid_llm_calls_per_run",
            "{call}",
            "Number of LLM completion calls made during a single authority run.");

    
    /// <summary>LLM completions that used the fallback client after primary throttling or server errors (labels: deployment).</summary>
    public static readonly Counter<long> LlmCompletionFallbackEngagementsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_completion_fallback_engagements_total",
            description: "LLM completion calls fulfilled via FallbackAgentCompletionClient (label: deployment).");

    
    /// <summary>Completion token distribution tagged by agent consume role and invoke kind (TB-015).</summary>
    public static readonly Histogram<long> LlmCompletionTokensDimensional =
        AppMeter.CreateHistogram<long>(
            "archlucid.llm.completion_tokens",
            description: "Completion token distribution tagged by archlucid.llm.consume_role and archlucid.llm.invoke_kind.");

    
    /// <summary>Azure OpenAI chat completion output tokens.</summary>
    public static readonly Counter<long> LlmCompletionTokensTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_completion_tokens_total",
            description: "Cumulative completion tokens reported by Azure OpenAI completions.");

    
    /// <summary>Azure AI Content Safety blocks on LLM envelope prompts/responses (labels <c>stage</c>, <c>category</c>).</summary>
    public static readonly Counter<long> LlmContentSafetyBlockedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_content_safety_blocked_total",
            description: "Content safety blocked outbound prompts or completions (labels stage, category).");

    
    /// <summary>
    ///     Pre-tax estimated LLM spend counter (label <c>tenant</c>). Monitoring-grade only — not invoice-reconciliation-grade.
    ///     See instrument description for IEEE 754 <c>decimal</c>-to-<c>double</c> rounding caveats (TB-025).
    /// </summary>
    public static readonly Counter<double> LlmCostUsdTotal =
        AppMeter.CreateCounter<double>(
            "archlucid_llm_cost_usd_total",
            "USD",
            "Pre-tax estimated LLM spend in USD from token counts × configured per-million rates (label tenant). Monitoring-grade only — not invoice-reconciliation-grade; the decimal-to-double cast introduces sub-microdollar IEEE 754 rounding. Does not include VAT/GST.");

    
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

    
    /// <summary>Judge paths skipped fail-open when the isolated judge UTC-day token pool is exhausted (TB-190).</summary>
    public static readonly Counter<long> LlmJudgeBudgetExhaustedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_judge_budget_exhausted_total",
            description: "LLM-as-judge or faithfulness judge skipped because the judge daily token sub-cap was exhausted.");

    
    /// <summary>Monthly USD reserve admission denied due to concurrent in-flight reservation ceiling (TB-977).</summary>
    public static readonly Counter<long> LlmMonthlyBudgetAdmissionBlockedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_monthly_budget_admission_blocked_total",
            description: "Monthly USD reserve admission denied due to concurrent in-flight reservation ceiling (TB-977).");

    
    /// <summary>Monthly USD reserve/settle optimistic concurrency retries exhausted (TB-977).</summary>
    public static readonly Counter<long> LlmMonthlyBudgetOptimisticRetryExhaustedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_monthly_budget_optimistic_retry_exhausted_total",
            description: "Monthly USD reserve/settle optimistic concurrency retries exhausted (TB-977).");

    
    /// <summary>Monthly USD reserve/settle used SQL-authoritative period remap (TB-977).</summary>
    public static readonly Counter<long> LlmMonthlyBudgetPeriodRemapTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_monthly_budget_period_remap_total",
            description: "Monthly USD reserve/settle observed caller/SQL UTC month mismatch (TB-977).");

    
    /// <summary>Expired monthly per-call reservation leases reclaimed by background worker (TB-976).</summary>
    public static readonly Counter<long> LlmMonthlyBudgetReservationReclaimedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_monthly_budget_reservation_reclaimed_total",
            description: "Expired monthly per-call USD reservation leases reclaimed (TB-976).");

    
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

    
    /// <summary>Azure OpenAI chat completion prompt (input) tokens.</summary>
    public static readonly Counter<long> LlmPromptTokensTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_prompt_tokens_total",
            description: "Cumulative prompt tokens reported by Azure OpenAI completions.");

    
    /// <summary>
    ///     LLM completions rejected by per-tenant sliding-window token quota or UTC-day budget (pre-call, in
    ///     <c>LlmCompletionAccountingClient</c>).
    /// </summary>
    public static readonly Counter<long> LlmQuotaExceededTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_quota_exceeded_total",
            description: "LLM calls rejected by tenant token quota or daily budget before outbound completion.");

    
    /// <summary>
    ///     HTTP 429 Too Many Responses from the LLM completion transport (labels: <c>retry_after</c>=header|fallback).
    ///     Recorded in <c>AzureOpenAiCompletionClient</c> before honoring <c>Retry-After</c> / fallback backoff.
    /// </summary>
    public static readonly Counter<long> LlmRateLimitTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_rate_limit_total",
            description:
            "LLM completion rate-limit responses (HTTP 429) before retry wait (labels: retry_after=header|fallback).");

    private static readonly AsyncLocal<AgentExecutionLlmCallAccumulator?> LlmCallsPerRunAccumulator = new();

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

    /// <summary>Records one completed Azure OpenAI Batch API job and estimated savings (TB-685).</summary>
    public static void RecordLlmBatchCompletionRun(
        int requestCount,
        int promptTokens,
        int completionTokens,
        double estimatedSavingsUsd)
    {
        if (requestCount < 1)
            return;

        TagList tags = [];
        tags.Add("path", "offline_batch");

        LlmBatchJobsCompletedTotal.Add(1, tags);
        LlmPromptTokensTotal.Add(promptTokens, tags);
        LlmCompletionTokensTotal.Add(completionTokens, tags);

        if (estimatedSavingsUsd > 0)
            LlmBatchEstimatedSavingsUsdTotal.Add(estimatedSavingsUsd, tags);
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

    /// <summary>
    ///     Adds pre-tax <paramref name="estimatedCostUsd" /> to <see cref="LlmCostUsdTotal" /> when positive.
    ///     Values are cast to <see cref="double" /> for the OTel counter (monitoring-grade IEEE 754 rounding only).
    /// </summary>
    public static void RecordLlmCostUsd(decimal estimatedCostUsd, string? tenantLabel)
    {
        if (estimatedCostUsd <= 0m)
            return;

        string tenant = string.IsNullOrWhiteSpace(tenantLabel) ? "unknown" : tenantLabel.Trim();
        TagList tags = new() { { "tenant", tenant } };

        // OTel Counter<double> requires double; sub-microdollar decimal values are not always exactly representable
        // in IEEE 754. Acceptable for dashboards/alerts — use persisted decimal EstimatedCostUsd for audit reconciliation.
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
        string? llmDeploymentLabel = null,
        string? consumeRole = null,
        string? invokeKind = null,
        long cachedPromptTokens = 0)
    {
        bool hasDimensionalTags = !string.IsNullOrEmpty(consumeRole) || !string.IsNullOrEmpty(invokeKind);
        bool hasTags = (recordPerTenant && !string.IsNullOrEmpty(tenantIdNormalized))
                       || !string.IsNullOrEmpty(llmProviderId)
                       || !string.IsNullOrEmpty(llmDeploymentLabel)
                       || hasDimensionalTags;

        if (promptTokens > 0)
        {
            Interlocked.Add(ref _llmProviderPromptTokensAggregate, promptTokens);

            if (hasTags)
                LlmPromptTokensTotal.Add(promptTokens, BuildTags());
            else
                LlmPromptTokensTotal.Add(promptTokens);
        }

        if (cachedPromptTokens > 0)
        {
            Interlocked.Add(ref _llmProviderCachedPromptTokensAggregate, cachedPromptTokens);

            if (hasTags)
                LlmCachedPromptTokensTotal.Add(cachedPromptTokens, BuildTags());
            else
                LlmCachedPromptTokensTotal.Add(cachedPromptTokens);
        }

        if (promptTokens > 0 || cachedPromptTokens > 0)
            EnsureLlmPromptCacheObservableInstrumentsRegistered();

        if (completionTokens <= 0)
            return;

        if (hasTags)
            LlmCompletionTokensTotal.Add(completionTokens, BuildTags());
        else
            LlmCompletionTokensTotal.Add(completionTokens);

        if (hasDimensionalTags)
            LlmCompletionTokensDimensional.Record(completionTokens, BuildDimensionalTags());

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

            if (!string.IsNullOrEmpty(consumeRole))
                tags.Add("archlucid.llm.consume_role", consumeRole);

            if (!string.IsNullOrEmpty(invokeKind))
                tags.Add("archlucid.llm.invoke_kind", invokeKind);

            return tags;
        }

        TagList BuildDimensionalTags()
        {
            TagList tags = [];

            if (!string.IsNullOrEmpty(consumeRole))
                tags.Add("archlucid.llm.consume_role", consumeRole);

            if (!string.IsNullOrEmpty(invokeKind))
                tags.Add("archlucid.llm.invoke_kind", invokeKind);

            return tags;
        }
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
