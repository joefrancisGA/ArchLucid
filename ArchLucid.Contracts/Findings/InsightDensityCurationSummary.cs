namespace ArchLucid.Contracts.Findings;

/// <summary>TB-385 curation counts for a findings snapshot after insight-density routing.</summary>
public sealed class InsightDensityCurationSummary
{
    public int DemotedToChecklistCount
    {
        get;
        set;
    }

    public int RetainedFindingCount
    {
        get;
        set;
    }
}
