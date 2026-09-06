using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Findings;

namespace ArchLucid.Application.Configuration;

/// <summary>
///     Merges host and tenant insight-density judge flags with Real-mode effective defaults (DX-02).
/// </summary>
internal static class InsightDensityGateEffectiveOptionsMerger
{
    internal static bool IsRealExecutionMode(string effectiveAgentExecutionMode)
    {
        return string.Equals(
            effectiveAgentExecutionMode,
            DevAgentExecutionModeHeaderNames.Real,
            StringComparison.OrdinalIgnoreCase);
    }

    internal static bool ResolveEnableLlmJudge(
        bool isOverridden,
        bool tenantValue,
        bool isRealExecutionMode)
    {
        if (!isRealExecutionMode)
            return false;

        if (isOverridden)
            return tenantValue;

        return true;
    }

    internal static void ApplyExecutionModePolicy(
        InsightDensityGateOptions effective,
        bool isRealExecutionMode,
        bool llmJudgeOverridden,
        bool llmJudgeTenantValue,
        bool engineJudgeOverridden,
        bool engineJudgeTenantValue)
    {
        effective.EnableLlmJudge = ResolveEnableLlmJudge(
            llmJudgeOverridden,
            llmJudgeTenantValue,
            isRealExecutionMode);

        effective.EnableLlmJudgeForEngineFindings = ResolveEnableLlmJudge(
            engineJudgeOverridden,
            engineJudgeTenantValue,
            isRealExecutionMode);
    }
}
