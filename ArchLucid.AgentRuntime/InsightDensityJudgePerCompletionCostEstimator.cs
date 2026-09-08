using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Configuration;

namespace ArchLucid.AgentRuntime;

/// <summary>Conservative Premium judge completion cost for pre-flight cap sizing (DX-62).</summary>
internal static class InsightDensityJudgePerCompletionCostEstimator
{
    internal const int AssumedUserPromptTokens = 1_200;

    internal const int AssumedCompletionTokens = 450;

    internal static decimal? EstimateUsd(ILlmCostEstimator? costEstimator, string? premiumDeploymentName)
    {
        if (costEstimator is null)
        {
            return null;
        }

        string systemPrompt = InsightDensityJudgeSystemPromptTemplate.GetText();
        int systemPromptTokens = AgentModelCatalogTokenMath.EstimateTokensFromCharCount(systemPrompt.Length, entry: null);
        int promptTokens = systemPromptTokens + AssumedUserPromptTokens;

        return costEstimator.EstimateUsd(
            promptTokens,
            AssumedCompletionTokens,
            deploymentLabel: premiumDeploymentName);
    }
}
