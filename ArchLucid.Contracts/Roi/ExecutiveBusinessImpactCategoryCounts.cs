namespace ArchLucid.Contracts.Roi;

/// <summary>
///     Pre-bucketed finding theme counts for the executive business-impact widget (TB-105).
/// </summary>
public sealed class ExecutiveBusinessImpactCategoryCounts
{
    /// <summary>Security, compliance, and privacy themed findings across latest committed runs.</summary>
    public int SecurityComplianceThemeCount
    {
        get;
        set;
    }

    /// <summary>Reliability, availability, and resilience themed findings across latest committed runs.</summary>
    public int ReliabilityThemeCount
    {
        get;
        set;
    }
}
