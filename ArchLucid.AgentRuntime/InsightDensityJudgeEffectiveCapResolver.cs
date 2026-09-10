using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;

namespace ArchLucid.AgentRuntime;

internal sealed record InsightDensityJudgeEffectiveCapResolution(
    int ConfiguredCap,
    int EffectiveCap,
    int? ReportConfiguredCap,
    int? ReportEffectiveCap);

/// <summary>
///     Shrinks the configured judge cap from remaining tenant UTC-month USD before selecting candidates (DX-62).
/// </summary>
/// <remarks>
///     Fail-open when budget services are unavailable — same posture as
///     <see cref="Application.ArchitectureIntelligence.ArchitectureIntelligenceReviewTierBudgetGuard" />.
/// </remarks>
internal static class InsightDensityJudgeEffectiveCapResolver
{
    internal static async Task<InsightDensityJudgeEffectiveCapResolution> ResolveAsync(
        int configuredCap,
        ITenantAiBudgetPolicyResolver? budgetPolicyResolver,
        ILlmCostEstimator? costEstimator,
        string? premiumDeploymentName,
        IScopeContextProvider? scopeContextProvider,
        CancellationToken cancellationToken)
    {
        if (configuredCap <= 0)
        {
            return new InsightDensityJudgeEffectiveCapResolution(0, 0, 0, 0);
        }

        decimal? estimatedCostPerJudgmentUsd = InsightDensityJudgePerCompletionCostEstimator.EstimateUsd(
            costEstimator,
            premiumDeploymentName);

        if (budgetPolicyResolver is null || scopeContextProvider is null)
        {
            return new InsightDensityJudgeEffectiveCapResolution(configuredCap, configuredCap, null, null);
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
        {
            return new InsightDensityJudgeEffectiveCapResolution(configuredCap, configuredCap, null, null);
        }

        TenantAiBudgetPolicySnapshot policy = await budgetPolicyResolver
            .ResolveAsync(scope.TenantId, cancellationToken)
            .ConfigureAwait(false);

        int effectiveCap = InsightDensityJudgeBudgetCap.Resolve(
            configuredCap,
            policy.RemainingAmountUsd,
            estimatedCostPerJudgmentUsd);

        if (effectiveCap < configuredCap)
        {
            return new InsightDensityJudgeEffectiveCapResolution(
                configuredCap,
                effectiveCap,
                configuredCap,
                effectiveCap);
        }

        return new InsightDensityJudgeEffectiveCapResolution(configuredCap, effectiveCap, null, null);
    }
}
