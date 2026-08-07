using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// Copies pre-flight admission facts onto a reasoning result so callers can render estimated cost
/// and remaining AI budget without re-running the guard.
/// </summary>
public static class ArchitectureIntelligenceBudgetResultApplier
{
    private const string DefaultRejectReason = "Pre-flight AI budget admission rejected this analysis.";

    public static void Apply(ClosedLoopReasoningResult result, ArchitectureIntelligenceBudgetDecision decision)
    {
        ArgumentNullException.ThrowIfNull(result);
        ArgumentNullException.ThrowIfNull(decision);

        result.BudgetEstimatedTokens = decision.EstimatedTokens;
        result.BudgetMaxTokens = decision.MaxTokens;
        result.BudgetEstimatedCostUsd = decision.EstimatedCostUsd;
        result.BudgetRemainingUsd = decision.RemainingBudgetUsd;
        result.BudgetEnforced = decision.BudgetEnforced;
    }

    public static ClosedLoopReasoningResult CreateRejected(
        string runId,
        ArchitectureIntelligenceBudgetDecision decision)
    {
        ArgumentNullException.ThrowIfNull(decision);

        string reason = decision.RejectReason ?? DefaultRejectReason;

        ClosedLoopReasoningResult result = new()
        {
            RunId = runId,
            BudgetRejected = true,
            BudgetRejectReason = reason,
            PublishBlocked = true,
            PublishBlockReasons = [reason],
        };

        Apply(result, decision);

        return result;
    }
}
