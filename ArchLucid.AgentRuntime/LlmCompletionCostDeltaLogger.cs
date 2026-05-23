using System.Diagnostics;
using System.Globalization;

using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Emits structured estimate-vs-actual LLM cost telemetry after each successful completion (tuning input for budget guards).
/// </summary>
public static class LlmCompletionCostDeltaLogger
{
    /// <summary>Stable log event name for support queries (see docs/runbooks/LLM_COST_ESTIMATION.md).</summary>
    public const string EventName = "archlucid.llm.cost_delta";

    /// <summary>
    ///     Logs structured estimate-vs-actual token and USD deltas when usage was consumed from the inner client.
    /// </summary>
    public static void LogIfEnabled(
        ILogger logger,
        ILlmCostEstimator costEstimator,
        IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> monthlyBudgetOptions,
        int actualPromptTokens,
        int actualCompletionTokens)
    {
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(costEstimator);
        ArgumentNullException.ThrowIfNull(monthlyBudgetOptions);

        if (actualPromptTokens < 1 && actualCompletionTokens < 1)
            return;

        if (!logger.IsEnabled(LogLevel.Information))
            return;

        LlmMonthlyTenantDollarBudgetOptions opts = monthlyBudgetOptions.CurrentValue;
        int estimatedPromptTokens = Math.Clamp(opts.AssumedMaxPromptTokensPerRequest, 1, 1_000_000);
        int estimatedCompletionTokens = Math.Clamp(opts.AssumedMaxCompletionTokensPerRequest, 1, 262_144);
        decimal? estimatedUsd = costEstimator.EstimateUsd(estimatedPromptTokens, estimatedCompletionTokens);
        decimal? actualUsd = costEstimator.EstimateUsd(actualPromptTokens, actualCompletionTokens);

        if (estimatedUsd is null or <= 0m || actualUsd is null)
            return;

        decimal deltaUsd = actualUsd.Value - estimatedUsd.Value;
        (string? runId, string? agentType) = TryReadRunContextFromActivity();

        using (logger.BeginScope(
                   new Dictionary<string, object?>
                   {
                       ["EventName"] = EventName,
                       ["RunId"] = runId,
                       ["AgentType"] = agentType,
                       ["EstimatedPromptTokens"] = estimatedPromptTokens,
                       ["EstimatedCompletionTokens"] = estimatedCompletionTokens,
                       ["EstimatedUsd"] = estimatedUsd.Value,
                       ["ActualPromptTokens"] = actualPromptTokens,
                       ["ActualCompletionTokens"] = actualCompletionTokens,
                       ["ActualUsd"] = actualUsd.Value,
                       ["DeltaUsd"] = deltaUsd
                   }))
        {
            logger.LogInformation(
                "{EventName} runId={RunId} agentType={AgentType} estimatedPrompt={EstimatedPromptTokens} estimatedCompletion={EstimatedCompletionTokens} estimatedUsd={EstimatedUsd} actualPrompt={ActualPromptTokens} actualCompletion={ActualCompletionTokens} actualUsd={ActualUsd} deltaUsd={DeltaUsd}",
                EventName,
                runId ?? "unknown",
                agentType ?? "unknown",
                estimatedPromptTokens,
                estimatedCompletionTokens,
                estimatedUsd.Value.ToString(CultureInfo.InvariantCulture),
                actualPromptTokens,
                actualCompletionTokens,
                actualUsd.Value.ToString(CultureInfo.InvariantCulture),
                deltaUsd.ToString(CultureInfo.InvariantCulture));
        }
    }

    private static (string? RunId, string? AgentType) TryReadRunContextFromActivity()
    {
        string? runId = null;
        string? agentType = null;
        Activity? current = Activity.Current;

        while (current is not null)
        {
            runId ??= current.GetTagItem("archlucid.run_id") as string;
            agentType ??= current.GetTagItem("archlucid.agent.type_enum") as string;

            if (runId is not null && agentType is not null)
                break;

            current = current.Parent;
        }

        return (runId, agentType);
    }
}
