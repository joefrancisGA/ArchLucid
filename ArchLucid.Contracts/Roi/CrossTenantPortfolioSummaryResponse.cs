namespace ArchLucid.Contracts.Roi;

/// <summary>
///     Cross-tenant portfolio ROI rollup for multi-tenant operators.
///     Enforces k-anonymity and strict data isolation.
/// </summary>
public sealed class CrossTenantPortfolioSummaryResponse
{
    /// <summary>
    ///     Sum of disposition-aware headline savings (open + needs-evidence USD) across accessible tenants —
    ///     same semantics as <see cref="SponsorRoiSummaryResponse.TotalEstimatedUsdSavings"/>.
    /// </summary>
    public decimal TotalEstimatedUsdSavings { get; set; }

    /// <summary>Total number of distinct systems across all accessible tenants.</summary>
    public int TotalSystemCount { get; set; }

    /// <summary>Total number of critical findings across all accessible tenants.</summary>
    public int TotalCriticalFindings { get; set; }

    /// <summary>Top five (category, severity) finding groups across all accessible tenants.</summary>
    public List<SystemicIssueSummary> TopSystemicIssues { get; set; } = [];

    /// <summary>Whether k-anonymity was satisfied (k >= 5). If false, metrics are zeroed out.</summary>
    public bool IsKAnonymitySatisfied { get; set; }

    /// <summary><see cref="RoiSponsorFacingScopeCodes.CrossTenantPortfolioHeadline" /> scope code.</summary>
    public string HeadlineSavingsScopeCode { get; set; } = RoiSponsorFacingScopeCodes.CrossTenantPortfolioHeadline;

    /// <summary>Human-readable scope for <see cref="TotalEstimatedUsdSavings" />.</summary>
    public string HeadlineSavingsScopeDescription { get; set; } = RoiSponsorFacingScopeDescriptions.CrossTenantPortfolioHeadline;

    /// <summary>Portfolio boundary note (multi-tenant, k-anonymity gate).</summary>
    public string PortfolioScopeDescription { get; set; } = RoiSponsorFacingScopeDescriptions.CrossTenantPortfolioHeadline;
}
