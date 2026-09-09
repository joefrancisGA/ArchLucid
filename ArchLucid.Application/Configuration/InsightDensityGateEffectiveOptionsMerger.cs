using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Findings;

namespace ArchLucid.Application.Configuration;

/// <summary>
///     Merges host and tenant insight-density flags with Real-mode effective defaults (DX-02, DX-57).
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
        return ResolveRealModeFlag(
            new InsightDensityTenantFlagOverride(isOverridden, tenantValue),
            isRealExecutionMode);
    }

    /// <summary>
    ///     Resolves a flag that is off everywhere except Real mode, where it is on unless the tenant opted out.
    /// </summary>
    internal static bool ResolveRealModeFlag(
        InsightDensityTenantFlagOverride tenantOverride,
        bool isRealExecutionMode)
    {
        ArgumentNullException.ThrowIfNull(tenantOverride);

        // Simulator and offline modes never run paid generative paths, so a stored tenant "true" cannot enable them.
        if (!isRealExecutionMode)
            return false;

        if (tenantOverride.IsOverridden)
            return tenantOverride.Value;

        return true;
    }

    internal static void ApplyExecutionModePolicy(
        InsightDensityGateOptions effective,
        bool isRealExecutionMode,
        InsightDensityTenantFlagOverrides tenantOverrides)
    {
        ArgumentNullException.ThrowIfNull(effective);
        ArgumentNullException.ThrowIfNull(tenantOverrides);

        effective.EnableLlmJudge = ResolveRealModeFlag(tenantOverrides.LlmJudge, isRealExecutionMode);

        effective.EnableLlmJudgeForEngineFindings = ResolveRealModeFlag(
            tenantOverrides.LlmJudgeForEngineFindings,
            isRealExecutionMode);

        effective.EnableInsightGenerator = ResolveRealModeFlag(
            tenantOverrides.InsightGenerator,
            isRealExecutionMode);

        // DX-57: the two prior flags only reorder the Premium judge-cap candidate list. They issue no completions of
        // their own, so Real mode turns them on and the cap in MaxJudgedFindingsPerSnapshot still bounds spend.
        effective.PreferHighNoveltyEngines = ResolveRealModeFlag(
            tenantOverrides.PreferHighNoveltyEngines,
            isRealExecutionMode);

        effective.PreferHighVerificationEngines = ResolveRealModeFlag(
            tenantOverrides.PreferHighVerificationEngines,
            isRealExecutionMode);

        // Prose assumption extraction stays host/tenant opt-in even in Real mode: unlike the flags above it issues
        // extra Premium completions per in-batch document, so its cost scales with document count (DX-55).
        if (!isRealExecutionMode)
            effective.EnableProseAssumptionExtraction = false;
    }
}
