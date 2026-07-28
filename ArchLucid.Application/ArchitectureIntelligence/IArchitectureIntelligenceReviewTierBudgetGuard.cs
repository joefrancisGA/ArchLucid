using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IArchitectureIntelligenceReviewTierBudgetGuard
{
    ArchitectureIntelligenceBudgetDecision Evaluate(ClosedLoopReasoningRequest request);
}
