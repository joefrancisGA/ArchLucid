using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Exports;

/// <summary>Cross-run governance and ROI signals included in sponsor review packets (TB-062 / Batch C).</summary>
public sealed class SponsorReviewPacketPortfolioSignals
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

    private List<string> nextActions = [];

    public List<string> NextActions
    {
        get => nextActions;
        set => nextActions = ContractCollectionDefaults.Coalesce(value);
    }
}
