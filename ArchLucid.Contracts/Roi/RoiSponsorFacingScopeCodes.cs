namespace ArchLucid.Contracts.Roi;

/// <summary>Stable scope codes for sponsor-facing ROI totals (T2-6 semantic contract).</summary>
public static class RoiSponsorFacingScopeCodes
{
    /// <summary>Disposition-aware open + needs-evidence USD headline for Sponsor report surfaces.</summary>
    public const string HeadlineDispositionAware = "headline-disposition-aware-open-needs-evidence";

    /// <summary>Per-system latest-run snapshot potential before disposition partitioning.</summary>
    public const string SystemRowSnapshotPotential = "per-system-latest-run-snapshot-potential";

    /// <summary>Cross-tenant portfolio rollup using the same headline basis as single-tenant summary.</summary>
    public const string CrossTenantPortfolioHeadline = "cross-tenant-portfolio-headline";

    /// <summary>Tenant activity-window hours and ROI-model annualized USD (value report DOCX).</summary>
    public const string ValueReportActivityWindow = "tenant-activity-window-hours-roi-model";

    /// <summary>Trailing 30-day UTC finding review and discovery counters on Sponsor report.</summary>
    public const string Trailing30DayFindingEvents = "trailing-30d-utc-finding-events";

    /// <summary>Pilot scorecard run/manifest counts for a caller-selected UTC window.</summary>
    public const string PilotScorecardUtcWindow = "pilot-scorecard-utc-window";
}
