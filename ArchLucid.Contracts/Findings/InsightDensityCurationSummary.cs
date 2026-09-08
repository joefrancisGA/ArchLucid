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

    /// <summary>Configured Premium judge cap before remaining-budget shrink (DX-62).</summary>
    public int? JudgeConfiguredCap
    {
        get;
        set;
    }

    /// <summary>Effective Premium judge cap after remaining-budget shrink (DX-62).</summary>
    public int? JudgeEffectiveCap
    {
        get;
        set;
    }

    /// <summary>Ranked missing-input rollup persisted after engine invocation (DX-52).</summary>
    public IReadOnlyList<HeldCheckLedgerRollupEntry>? HeldCheckLedgerEntries
    {
        get;
        set;
    }

    /// <summary>Inventory-upload second-pass delta when findings were regenerated (DX-60).</summary>
    public HeldCheckSecondPassSummary? HeldCheckSecondPass
    {
        get;
        set;
    }
}
