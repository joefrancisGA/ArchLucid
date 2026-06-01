namespace ArchLucid.Contracts.Roi;

/// <summary>
///     Pre-bucketed finding theme counts for the executive business-impact widget (TB-105).
/// </summary>
public sealed class ExecutiveBusinessImpactCategoryCounts
{
    /// <summary>Security-themed findings (first matching pillar wins).</summary>
    public int SecurityThemeCount
    {
        get;
        set;
    }

    /// <summary>Compliance and privacy themed findings.</summary>
    public int ComplianceThemeCount
    {
        get;
        set;
    }

    /// <summary>Reliability, availability, and resilience themed findings.</summary>
    public int ReliabilityThemeCount
    {
        get;
        set;
    }

    /// <summary>Cost, FinOps, and waste themed findings.</summary>
    public int CostThemeCount
    {
        get;
        set;
    }

    /// <summary>Governance, policy, and control themed findings.</summary>
    public int GovernanceThemeCount
    {
        get;
        set;
    }

    /// <summary>Findings whose category does not map to a named pillar.</summary>
    public int OtherThemeCount
    {
        get;
        set;
    }

    /// <summary>Security + compliance counts for legacy dashboard tiles.</summary>
    public int SecurityComplianceThemeCount
    {
        get;
        set;
    }
}
