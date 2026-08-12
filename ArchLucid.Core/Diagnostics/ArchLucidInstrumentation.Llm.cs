using System.Diagnostics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     LLM usage telemetry: token counters, estimated USD spend, batch/offline paths, GenAI latency, prompt redaction,
///     and per-run completion accumulation.
/// </summary>
/// <remarks>
///     Instrument field declarations remain in <c>ArchLucidInstrumentation.cs</c>.
/// </remarks>
public static partial class ArchLucidInstrumentation
{
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
