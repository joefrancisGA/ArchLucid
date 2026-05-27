namespace ArchLucid.Contracts.Exports;

/// <summary>Cross-run governance and ROI signals included in executive review packets (TB-062 / Batch C).</summary>
public sealed class ExecutiveReviewPacketPortfolioSignals
{
    public int ResolvedFindingsCount30Days
    {
        get;
        set;
    }

    public int NewlyDiscoveredFindingsCount30Days
    {
        get;
        set;
    }

    public int StaleRiskCount
    {
        get;
        set;
    }

    public int ExpiringWaiversCount14Days
    {
        get;
        set;
    }

    public List<string> NextActions
    {
        get;
        set;
    } = [];
}
