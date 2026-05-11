using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Agents;

/// <summary>
///     Aggregates per-run prompt/completion token totals from persisted traces and sums per-call USD estimates from
///     <see cref="ILlmCostEstimator" /> using the same deployment normalization as trace recording.
/// </summary>
public static class AgentExecutionTraceRunLlmCostAggregator
{
    /// <param name="traces">All execution traces for the run (typically from <c>GetByRunIdAsync</c>).</param>
    /// <param name="costEstimator">Host-configured estimator (respects <see cref="LlmCostEstimationOptions.Enabled" />).</param>
    /// <returns>Token totals, optional summed USD, and a display label for model/deployment names.</returns>
    public static AgentExecutionTraceRunLlmCostSummary Compute(
        IReadOnlyList<AgentExecutionTrace> traces,
        ILlmCostEstimator costEstimator)
    {
        ArgumentNullException.ThrowIfNull(traces);
        ArgumentNullException.ThrowIfNull(costEstimator);

        int promptSum = 0;
        int completionSum = 0;
        decimal costAccum = 0m;
        bool anyCost = false;

        HashSet<string> measurableDeployments = new(StringComparer.Ordinal);

        foreach (AgentExecutionTrace trace in traces)
        {
            int inTok = trace.InputTokenCount ?? 0;
            int outTok = trace.OutputTokenCount ?? 0;

            promptSum += inTok;
            completionSum += outTok;

            if (inTok <= 0 && outTok <= 0)
                continue;

            string resolvedDeployment = string.IsNullOrWhiteSpace(trace.ModelDeploymentName)
                ? AgentExecutionTraceModelMetadata.UnspecifiedDeploymentName
                : trace.ModelDeploymentName.Trim();

            string? deploymentForCost =
                resolvedDeployment == AgentExecutionTraceModelMetadata.UnspecifiedDeploymentName
                    ? null
                    : resolvedDeployment;

            decimal? slice = costEstimator.EstimateUsd(inTok, outTok, 0, deploymentForCost);

            if (slice is decimal d)
            {
                costAccum += d;
                anyCost = true;
            }

            if (!string.IsNullOrWhiteSpace(trace.ModelDeploymentName))
                measurableDeployments.Add(trace.ModelDeploymentName.Trim());
        }

        string modelLabel = BuildModelLabel(traces, measurableDeployments);

        decimal? estimatedUsd = null;

        if (promptSum + completionSum > 0)
            estimatedUsd = anyCost ? costAccum : null;

        return new AgentExecutionTraceRunLlmCostSummary(estimatedUsd, promptSum, completionSum, modelLabel);
    }

    private static string BuildModelLabel(
        IReadOnlyList<AgentExecutionTrace> traces,
        HashSet<string> measurableDeployments)
    {
        if (measurableDeployments.Count > 0)
            return string.Join(", ", measurableDeployments.Order(StringComparer.Ordinal));

        HashSet<string> fallback = new(StringComparer.Ordinal);

        foreach (AgentExecutionTrace trace in traces)
        {
            if (!string.IsNullOrWhiteSpace(trace.ModelDeploymentName))
                fallback.Add(trace.ModelDeploymentName.Trim());
        }

        return fallback.Count > 0 ? string.Join(", ", fallback.Order(StringComparer.Ordinal)) : string.Empty;
    }
}

/// <summary>Per-run LLM usage totals derived from <see cref="AgentExecutionTrace" /> rows.</summary>
public sealed record AgentExecutionTraceRunLlmCostSummary(
    decimal? EstimatedCostUsd,
    int PromptTokens,
    int CompletionTokens,
    string ModelLabel);
