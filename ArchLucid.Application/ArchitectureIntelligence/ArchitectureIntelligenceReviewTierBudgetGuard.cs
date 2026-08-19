using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// Pre-flight admission for closed-loop reasoning (TB-1992).
/// Sizes the request against the selected analysis depth, then against the tenant's real remaining
/// UTC-month AI budget — the same balance the AI usage dashboard and budget pill report.
/// </summary>
/// <remarks>
/// This is an affordance, not the hard cap. <c>AiBudgetPreCallGuard</c> inside the completion chain is the
/// enforcement point and still fires per LLM call. When budget services are unavailable this guard permits on
/// depth alone rather than blocking work, because failing closed here would disable reasoning on hosts that
/// deliberately run without budget policy.
/// </remarks>
public sealed class ArchitectureIntelligenceReviewTierBudgetGuard : IArchitectureIntelligenceReviewTierBudgetGuard
{
    private readonly ITenantAiBudgetPolicyResolver? _budgetPolicyResolver;
    private readonly ILlmCostEstimator? _costEstimator;
    private readonly IAgentModelAliasRegistry? _modelAliasRegistry;

    public ArchitectureIntelligenceReviewTierBudgetGuard(
        ITenantAiBudgetPolicyResolver? budgetPolicyResolver = null,
        ILlmCostEstimator? costEstimator = null,
        IAgentModelAliasRegistry? modelAliasRegistry = null)
    {
        _budgetPolicyResolver = budgetPolicyResolver;
        _costEstimator = costEstimator;
        _modelAliasRegistry = modelAliasRegistry;
    }

    public async Task<ArchitectureIntelligenceBudgetDecision> EvaluateAsync(
        ClosedLoopReasoningRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        AgentModelAliasRegistryEntry? catalogEntry = ResolveCatalogEntry(request);
        int promptTokens = EstimatePromptTokens(request, catalogEntry);
        int depthAllowance = DepthTokenAllowance(request.ReviewTier);

        TenantAiBudgetPolicySnapshot? policy = await TryResolvePolicyAsync(request, cancellationToken);
        decimal? estimatedCostUsd = TryEstimateCostUsd(promptTokens, request.ReviewTier, catalogEntry);
        decimal? remainingUsd = policy?.RemainingAmountUsd;

        ArchitectureIntelligenceBudgetEstimate estimate = new()
        {
            EstimatedTokens = promptTokens,
            DepthTokenAllowance = depthAllowance,
            EstimatedCostUsd = estimatedCostUsd,
            RemainingBudgetUsd = remainingUsd,
            BudgetEnforced = estimatedCostUsd.HasValue && remainingUsd.HasValue,
        };

        if (promptTokens > depthAllowance)
        {
            return ArchitectureIntelligenceBudgetDecision.Reject(estimate, DepthRejectReason(request.ReviewTier, estimate));
        }

        string? budgetReject = ResolveBudgetRejectReason(policy, estimate);

        if (budgetReject is not null)
        {
            return ArchitectureIntelligenceBudgetDecision.Reject(estimate, budgetReject);
        }

        return ArchitectureIntelligenceBudgetDecision.Permit(estimate);
    }

    /// <summary>Largest input each depth is sized for. Sizing only — spend is capped in USD.</summary>
    internal static int DepthTokenAllowance(ArchitectureIntelligenceReviewTier tier)
    {
        return tier switch
        {
            ArchitectureIntelligenceReviewTier.Trial => 8_000,
            ArchitectureIntelligenceReviewTier.Standard => 40_000,
            ArchitectureIntelligenceReviewTier.Deep => 120_000,
            _ => 40_000,
        };
    }

    internal static int EstimatePromptTokens(
        ClosedLoopReasoningRequest request,
        AgentModelAliasRegistryEntry? catalogEntry = null)
    {
        ArgumentNullException.ThrowIfNull(request);

        int sourceChars = request.SourceTexts.Sum(source => (source.Content ?? string.Empty).Length);
        int framingChars = request.FramingAnswers.Sum(pair =>
            pair.Key.Length + (pair.Value?.Length ?? 0));

        int contentTokens = Math.Max(
            1,
            AgentModelCatalogTokenMath.EstimateTokensFromCharCount(sourceChars + framingChars, catalogEntry));

        return contentTokens + RoleOverheadTokens(request.ReviewTier);
    }

    /// <summary>Prompt tokens spent on specialist role framing, independent of source size.</summary>
    internal static int RoleOverheadTokens(ArchitectureIntelligenceReviewTier tier)
    {
        return tier switch
        {
            ArchitectureIntelligenceReviewTier.Trial => 1_500,
            ArchitectureIntelligenceReviewTier.Standard => 6_000,
            ArchitectureIntelligenceReviewTier.Deep => 18_000,
            _ => 6_000,
        };
    }

    /// <summary>
    /// Assumed completion tokens across the whole loop (extraction, specialist reviews, adversarial pass,
    /// recommendations). Scaled with depth because deeper tiers run more specialist roles.
    /// </summary>
    internal static int AssumedCompletionTokens(ArchitectureIntelligenceReviewTier tier)
    {
        return tier switch
        {
            ArchitectureIntelligenceReviewTier.Trial => 2_000,
            ArchitectureIntelligenceReviewTier.Standard => 8_000,
            ArchitectureIntelligenceReviewTier.Deep => 24_000,
            _ => 8_000,
        };
    }

    private AgentModelAliasRegistryEntry? ResolveCatalogEntry(ClosedLoopReasoningRequest request)
    {
        if (_modelAliasRegistry is null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(request.ModelAliasId)
            && _modelAliasRegistry.TryGet(request.ModelAliasId, out AgentModelAliasRegistryEntry? byAlias)
            && byAlias is not null)
        {
            return byAlias;
        }

        string tierAliasId = _modelAliasRegistry.ResolveAliasIdForTier(MapReviewTierToModelTier(request.ReviewTier));

        if (_modelAliasRegistry.TryGet(tierAliasId, out AgentModelAliasRegistryEntry? byTier) && byTier is not null)
        {
            return byTier;
        }

        return null;
    }

    private static LlmModelTier MapReviewTierToModelTier(ArchitectureIntelligenceReviewTier tier) =>
        tier switch
        {
            ArchitectureIntelligenceReviewTier.Trial => LlmModelTier.Economy,
            ArchitectureIntelligenceReviewTier.Deep => LlmModelTier.Premium,
            _ => LlmModelTier.Standard,
        };

    private decimal? TryEstimateCostUsd(
        int promptTokens,
        ArchitectureIntelligenceReviewTier tier,
        AgentModelAliasRegistryEntry? catalogEntry)
    {
        if (_costEstimator is null)
        {
            return null;
        }

        return _costEstimator.EstimateUsd(
            promptTokens,
            AssumedCompletionTokens(tier),
            0,
            catalogEntry?.DeploymentName,
            catalogEntry?.AliasId);
    }

    private async Task<TenantAiBudgetPolicySnapshot?> TryResolvePolicyAsync(
        ClosedLoopReasoningRequest request,
        CancellationToken cancellationToken)
    {
        if (_budgetPolicyResolver is null)
        {
            return null;
        }

        Guid tenantId = ArchitectureIntelligenceTenantIdMapper.ToStorageGuidOrEmpty(request.TenantId);

        if (tenantId == Guid.Empty)
        {
            return null;
        }

        return await _budgetPolicyResolver.ResolveAsync(tenantId, cancellationToken);
    }

    private static string? ResolveBudgetRejectReason(
        TenantAiBudgetPolicySnapshot? policy,
        ArchitectureIntelligenceBudgetEstimate estimate)
    {
        if (policy is null)
        {
            return null;
        }

        if (policy.BlocksAdditionalLlmExecution)
        {
            return "The AI budget for this workspace is exhausted. Add budget to run architecture reasoning.";
        }

        if (!estimate.BudgetEnforced || !policy.HardStopEnabled)
        {
            return null;
        }

        if (estimate.EstimatedCostUsd!.Value <= estimate.RemainingBudgetUsd!.Value)
        {
            return null;
        }

        return
            $"This analysis is estimated at {FormatUsd(estimate.EstimatedCostUsd.Value)}, " +
            $"more than the {FormatUsd(estimate.RemainingBudgetUsd.Value)} of AI budget remaining. " +
            "Choose a lighter analysis depth, trim the sources, or add budget.";
    }

    private static string DepthRejectReason(
        ArchitectureIntelligenceReviewTier tier,
        ArchitectureIntelligenceBudgetEstimate estimate)
    {
        return
            $"The supplied sources are about {estimate.EstimatedTokens:N0} tokens, larger than the " +
            $"{estimate.DepthTokenAllowance:N0} the {tier} analysis depth is sized for. " +
            "Choose a deeper analysis or trim the sources.";
    }

    private static string FormatUsd(decimal amount) => $"${amount:0.00}";
}
