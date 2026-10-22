using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IArchitectureIntelligenceReviewTierBudgetGuard
{
    /// <summary>
    /// Pre-flight admission for one closed-loop run: sizes the request against the selected analysis depth,
    /// then against the tenant's remaining UTC-month AI budget.
    /// </summary>
    Task<ArchitectureIntelligenceBudgetDecision> EvaluateAsync(
        ClosedLoopReasoningRequest request,
        CancellationToken cancellationToken = default);
}
