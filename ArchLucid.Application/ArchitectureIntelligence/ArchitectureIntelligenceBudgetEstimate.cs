namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// Pre-flight cost facts for one closed-loop reasoning request.
/// Token figures describe the selected analysis depth; USD figures describe real tenant budget pressure.
/// </summary>
public sealed class ArchitectureIntelligenceBudgetEstimate
{
    /// <summary>Estimated prompt tokens for the supplied sources plus per-depth role overhead.</summary>
    public int EstimatedTokens
    {
        get;
        init;
    }

    /// <summary>Largest input the selected depth is sized for. Not a spend cap.</summary>
    public int DepthTokenAllowance
    {
        get;
        init;
    }

    /// <summary>
    /// Estimated pre-tax cost of the whole closed loop, or <see langword="null" /> when
    /// <c>ILlmCostEstimator</c> has no configured rates.
    /// </summary>
    public decimal? EstimatedCostUsd
    {
        get;
        init;
    }

    /// <summary>Tenant budget left this UTC month, or <see langword="null" /> when no budget policy resolved.</summary>
    public decimal? RemainingBudgetUsd
    {
        get;
        init;
    }

    /// <summary>
    /// True when both a cost estimate and a remaining balance were available, so the USD comparison is meaningful.
    /// False means the guard permitted on depth alone and the mid-run <c>AiBudgetPreCallGuard</c> remains the backstop.
    /// </summary>
    public bool BudgetEnforced
    {
        get;
        init;
    }
}
