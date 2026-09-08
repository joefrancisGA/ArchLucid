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

    /// <summary>Premium insight-density LLM judge findings skipped by per-snapshot cap (DX-15).</summary>
    public int JudgeSkippedByCap
    {
        get;
        set;
    }
}
