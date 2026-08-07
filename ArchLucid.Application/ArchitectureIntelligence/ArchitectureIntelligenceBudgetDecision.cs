namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ArchitectureIntelligenceBudgetDecision
{
    private ArchitectureIntelligenceBudgetDecision(
        bool permitted,
        ArchitectureIntelligenceBudgetEstimate estimate,
        string? rejectReason)
    {
        ArgumentNullException.ThrowIfNull(estimate);

        Permitted = permitted;
        Estimate = estimate;
        RejectReason = rejectReason;
    }

    public bool Permitted
    {
        get;
    }

    public ArchitectureIntelligenceBudgetEstimate Estimate
    {
        get;
    }

    public string? RejectReason
    {
        get;
    }

    public int EstimatedTokens => Estimate.EstimatedTokens;

    /// <summary>Depth sizing, retained under the original name so existing callers keep compiling.</summary>
    public int MaxTokens => Estimate.DepthTokenAllowance;

    public decimal? EstimatedCostUsd => Estimate.EstimatedCostUsd;

    public decimal? RemainingBudgetUsd => Estimate.RemainingBudgetUsd;

    public bool BudgetEnforced => Estimate.BudgetEnforced;

    public static ArchitectureIntelligenceBudgetDecision Permit(ArchitectureIntelligenceBudgetEstimate estimate) =>
        new(true, estimate, null);

    public static ArchitectureIntelligenceBudgetDecision Reject(
        ArchitectureIntelligenceBudgetEstimate estimate,
        string reason) =>
        new(false, estimate, reason);
}
