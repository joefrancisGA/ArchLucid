namespace ArchLucid.Contracts.Roi;

/// <summary>
///     Cross-tenant portfolio ROI rollup for multi-tenant operators.
///     Enforces k-anonymity and strict data isolation.
/// </summary>
public sealed class CrossTenantPortfolioSummaryResponse
{
    /// <summary>Sum of estimated USD savings across all accessible tenants.</summary>
    public decimal TotalEstimatedUsdSavings { get; set; }

    /// <summary>Total number of distinct systems across all accessible tenants.</summary>
    public int TotalSystemCount { get; set; }

    /// <summary>Total number of critical findings across all accessible tenants.</summary>
    public int TotalCriticalFindings { get; set; }

    /// <summary>Top five (category, severity) finding groups across all accessible tenants.</summary>
    public List<SystemicIssueSummary> TopSystemicIssues { get; set; } = [];

    /// <summary>Whether k-anonymity was satisfied (k >= 5). If false, metrics are zeroed out.</summary>
    public bool IsKAnonymitySatisfied { get; set; }
}
