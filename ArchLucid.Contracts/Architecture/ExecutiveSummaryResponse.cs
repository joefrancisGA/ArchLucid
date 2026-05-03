namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     High-level executive summary of architectural health based on the latest run.
/// </summary>
public sealed class ExecutiveSummaryResponse
{
    public string TenantId { get; init; } = string.Empty;
    public string? LatestRunId { get; init; }
    public DateTime? LatestRunCompletedUtc { get; init; }
    
    /// <summary>0-100 score representing security posture (100 is best).</summary>
    public int SecurityPostureScore { get; init; }
    
    /// <summary>0-100 score representing technical debt risk (100 is best, i.e., lowest risk).</summary>
    public int TechDebtRiskScore { get; init; }
    
    /// <summary>0-100 score representing compliance alignment (100 is best).</summary>
    public int ComplianceAlignmentScore { get; init; }
}
