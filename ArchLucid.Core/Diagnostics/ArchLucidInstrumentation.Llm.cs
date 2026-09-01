using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>Thin forwarding partial preserving the public ArchLucidInstrumentation LLM API.</summary>
public static partial class ArchLucidInstrumentation
{
    public static readonly Counter<long> CircuitBreakerProbeOutcomes = ArchLucidLlmMeters.CircuitBreakerProbeOutcomes;

    public static readonly Counter<long> CircuitBreakerRejections = ArchLucidLlmMeters.CircuitBreakerRejections;

    public static readonly Counter<long> CircuitBreakerStateTransitions = ArchLucidLlmMeters.CircuitBreakerStateTransitions;

    public static readonly Counter<double> LlmBatchEstimatedSavingsUsdTotal = ArchLucidLlmMeters.LlmBatchEstimatedSavingsUsdTotal;

    public static readonly Counter<long> LlmBatchJobsCompletedTotal = ArchLucidLlmMeters.LlmBatchJobsCompletedTotal;

    public static readonly Counter<long> LlmCachedPromptTokensTotal = ArchLucidLlmMeters.LlmCachedPromptTokensTotal;

    public static readonly Counter<long> LlmCallRetries = ArchLucidLlmMeters.LlmCallRetries;

    public static readonly Histogram<int> LlmCallsPerRun = ArchLucidLlmMeters.LlmCallsPerRun;

    public static readonly Counter<long> LlmCompletionFallbackEngagementsTotal = ArchLucidLlmMeters.LlmCompletionFallbackEngagementsTotal;

    public static readonly Histogram<long> LlmCompletionTokensDimensional = ArchLucidLlmMeters.LlmCompletionTokensDimensional;

    public static readonly Counter<long> LlmCompletionTokensTotal = ArchLucidLlmMeters.LlmCompletionTokensTotal;

    public static readonly Counter<long> LlmCompletionOutputTruncatedTotal = ArchLucidLlmMeters.LlmCompletionOutputTruncatedTotal;

    public static readonly Counter<long> LlmContentSafetyBlockedTotal = ArchLucidLlmMeters.LlmContentSafetyBlockedTotal;

    public static readonly Counter<double> LlmCostUsdTotal = ArchLucidLlmMeters.LlmCostUsdTotal;

    public static readonly Counter<long> LlmEmbeddingInputTokensTotal = ArchLucidLlmMeters.LlmEmbeddingInputTokensTotal;

    public static readonly Histogram<double> LlmGenAiOperationDurationMilliseconds = ArchLucidLlmMeters.LlmGenAiOperationDurationMilliseconds;

    public static readonly Counter<long> LlmJudgeBudgetExhaustedTotal = ArchLucidLlmMeters.LlmJudgeBudgetExhaustedTotal;

    public static readonly Counter<long> LlmMonthlyBudgetAdmissionBlockedTotal = ArchLucidLlmMeters.LlmMonthlyBudgetAdmissionBlockedTotal;

    public static readonly Counter<long> LlmMonthlyBudgetOptimisticRetryExhaustedTotal = ArchLucidLlmMeters.LlmMonthlyBudgetOptimisticRetryExhaustedTotal;

    public static readonly Counter<long> LlmMonthlyBudgetPeriodRemapTotal = ArchLucidLlmMeters.LlmMonthlyBudgetPeriodRemapTotal;

    public static readonly Counter<long> LlmMonthlyBudgetReservationReclaimedTotal = ArchLucidLlmMeters.LlmMonthlyBudgetReservationReclaimedTotal;

    public static readonly Counter<long> LlmPromptRedactionsTotal = ArchLucidLlmMeters.LlmPromptRedactionsTotal;

    public static readonly Counter<long> LlmPromptRedactionSkippedTotal = ArchLucidLlmMeters.LlmPromptRedactionSkippedTotal;

    public static readonly Counter<long> LlmPromptTokensTotal = ArchLucidLlmMeters.LlmPromptTokensTotal;

    public static readonly Counter<long> LlmQuotaExceededTotal = ArchLucidLlmMeters.LlmQuotaExceededTotal;

    public static readonly Counter<long> LlmRateLimitTotal = ArchLucidLlmMeters.LlmRateLimitTotal;

    public static readonly Counter<long> AgentLogicalStepSpendCapHitsTotal = ArchLucidLlmMeters.AgentLogicalStepSpendCapHitsTotal;

    public static IDisposable BeginLlmCallsPerRunAccumulation(AgentExecutionLlmCallAccumulator accumulator) => ArchLucidLlmMeters.BeginLlmCallsPerRunAccumulation(accumulator);

    public static void RecordLlmCompletionCallForCurrentRunBatch() => ArchLucidLlmMeters.RecordLlmCompletionCallForCurrentRunBatch();

    public static void RecordAgentLogicalStepSpendCapHit(string agentTypeLabel) => ArchLucidLlmMeters.RecordAgentLogicalStepSpendCapHit(agentTypeLabel);

    public static void RecordLlmBatchCompletionRun(
        int requestCount,
        int promptTokens,
        int completionTokens,
        double estimatedSavingsUsd) => ArchLucidLlmMeters.RecordLlmBatchCompletionRun(requestCount, promptTokens, completionTokens, estimatedSavingsUsd);

    public static void RecordLlmCompletionFallbackEngaged(string deploymentLabel) => ArchLucidLlmMeters.RecordLlmCompletionFallbackEngaged(deploymentLabel);

    public static void RecordLlmCompletionOutputTruncated(string deploymentLabel) => ArchLucidLlmMeters.RecordLlmCompletionOutputTruncated(deploymentLabel);

    public static void RecordLlmPromptRedactions(string category, int matchCount) => ArchLucidLlmMeters.RecordLlmPromptRedactions(category, matchCount);

    public static void RecordLlmPromptRedactionSkipped(int count = 1) =>
        ArchLucidLlmMeters.RecordLlmPromptRedactionSkipped(count);

    public static void RecordLlmCostUsd(decimal estimatedCostUsd, string? tenantLabel) => ArchLucidLlmMeters.RecordLlmCostUsd(estimatedCostUsd, tenantLabel);

    public static void RecordLlmTokenUsage(
        long promptTokens,
        long completionTokens,
        bool recordPerTenant,
        string? tenantIdNormalized,
        string? llmProviderId = null,
        string? llmDeploymentLabel = null,
        string? consumeRole = null,
        string? invokeKind = null,
        long cachedPromptTokens = 0) =>
        ArchLucidLlmMeters.RecordLlmTokenUsage(
            promptTokens,
            completionTokens,
            recordPerTenant,
            tenantIdNormalized,
            llmProviderId,
            llmDeploymentLabel,
            consumeRole,
            invokeKind,
            cachedPromptTokens);

    public static void RecordLlmEmbeddingInputTokens(long inputTokens, string? llmDeploymentLabel) => ArchLucidLlmMeters.RecordLlmEmbeddingInputTokens(inputTokens, llmDeploymentLabel);

    public static void RecordLlmGenAiOperationDurationMilliseconds(
        string operationName,
        double durationMilliseconds,
        bool succeeded) => ArchLucidLlmMeters.RecordLlmGenAiOperationDurationMilliseconds(operationName, durationMilliseconds, succeeded);

}