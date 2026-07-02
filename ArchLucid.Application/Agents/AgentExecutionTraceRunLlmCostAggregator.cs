using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.AgentEvaluation;
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
    /// <remarks>
    ///     Re-estimates each trace slice using <paramref name="costEstimator" /> (live rates). The returned
    ///     <see cref="AgentExecutionTraceRunLlmCostSummary.EstimatedCostUsd" /> may differ from summing persisted
    ///     <see cref="AgentExecutionTrace.EstimatedCostUsd" /> on each row when rates changed between trace recording and this call (TB-023).
    /// </remarks>
    public static AgentExecutionTraceRunLlmCostSummary Compute(
        IReadOnlyList<AgentExecutionTrace> traces,
        ILlmCostEstimator costEstimator)
    {
        ArgumentNullException.ThrowIfNull(traces);
        ArgumentNullException.ThrowIfNull(costEstimator);

        return ComputeCore(
            traces.Select(static t => (
                t.ModelDeploymentName,
                t.InputTokenCount,
                t.OutputTokenCount,
                t.ReasoningTokenCount)),
            costEstimator);
    }

    /// <param name="slices">Token/deployment projection rows (typically from <c>GetLlmCostSlicesByRunIdAsync</c>).</param>
    public static AgentExecutionTraceRunLlmCostSummary Compute(
        IReadOnlyList<AgentExecutionTraceLlmCostSlice> slices,
        ILlmCostEstimator costEstimator)
    {
        ArgumentNullException.ThrowIfNull(slices);
        ArgumentNullException.ThrowIfNull(costEstimator);

        return ComputeCore(
            slices.Select(static s => (
                s.ModelDeploymentName,
                s.InputTokenCount,
                s.OutputTokenCount,
                s.ReasoningTokenCount)),
            costEstimator);
    }

    private static AgentExecutionTraceRunLlmCostSummary ComputeCore(
        IEnumerable<(string? ModelDeploymentName, int? InputTokenCount, int? OutputTokenCount, int? ReasoningTokenCount)> rows,
        ILlmCostEstimator costEstimator)
    {
        long promptSum = 0;
        long completionSum = 0;
        decimal costAccum = 0m;
        bool anyCost = false;

        HashSet<string> measurableDeployments = new(StringComparer.Ordinal);

        foreach ((string? modelDeploymentName, int? inputTokenCount, int? outputTokenCount, int? reasoningTokenCount) in rows)
        {
            int inTok = inputTokenCount ?? 0;
            int outTok = outputTokenCount ?? 0;
            // TB-196: use persisted reasoning token count (added by TB-033) rather than hard-coding 0,
            // so o-series / reasoning-model runs include that cost component in the estimate.
            int reasoningTok = reasoningTokenCount ?? 0;

            promptSum += inTok;
            completionSum += outTok;

            if (inTok <= 0 && outTok <= 0 && reasoningTok <= 0)
                continue;

            string resolvedDeployment = string.IsNullOrWhiteSpace(modelDeploymentName)
                ? AgentExecutionTraceModelMetadata.UnspecifiedDeploymentName
                : modelDeploymentName.Trim();

            string? deploymentForCost =
                resolvedDeployment == AgentExecutionTraceModelMetadata.UnspecifiedDeploymentName
                    ? null
                    : resolvedDeployment;

            decimal? slice = costEstimator.EstimateUsd(inTok, outTok, reasoningTok, deploymentForCost);

            if (slice is { } d)
            {
                costAccum += d;
                anyCost = true;
            }

            if (!string.IsNullOrWhiteSpace(modelDeploymentName))
                measurableDeployments.Add(modelDeploymentName.Trim());
        }

        string modelLabel = BuildModelLabelFromDeployments(measurableDeployments, rows);

        decimal? estimatedUsd = null;
        string costBasis = RunLlmCostEstimationBasis.Unavailable;

        // Reasoning-only traces (TB-196) have zero prompt/completion sums but may still produce a USD estimate.

        if (promptSum + completionSum <= 0 && !anyCost)
            return new AgentExecutionTraceRunLlmCostSummary(estimatedUsd, promptSum, completionSum, modelLabel, costBasis);

        if (anyCost)
        {
            estimatedUsd = costAccum;
            costBasis = RunLlmCostEstimationBasis.EstimatedFromConfiguredRates;
        }
        else
        {
            costBasis = RunLlmCostEstimationBasis.ProviderTokensWithoutRate;
        }

        return new AgentExecutionTraceRunLlmCostSummary(estimatedUsd, promptSum, completionSum, modelLabel, costBasis);
    }

    private static string BuildModelLabelFromDeployments(
        HashSet<string> measurableDeployments,
        IEnumerable<(string? ModelDeploymentName, int? InputTokenCount, int? OutputTokenCount, int? ReasoningTokenCount)> rows)
    {
        if (measurableDeployments.Count > 0)
            return string.Join(", ", measurableDeployments.Order(StringComparer.Ordinal));

        HashSet<string> fallback = new(StringComparer.Ordinal);

        foreach ((string? modelDeploymentName, _, _, _) in rows)
        {
            if (!string.IsNullOrWhiteSpace(modelDeploymentName))
                fallback.Add(modelDeploymentName.Trim());
        }

        return fallback.Count > 0 ? string.Join(", ", fallback.Order(StringComparer.Ordinal)) : string.Empty;
    }
}
