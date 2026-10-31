using ArchLucid.Contracts.Serialization;

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
    private IReadOnlyList<HeldCheckLedgerRollupEntry> heldCheckLedgerEntries = [];

    public IReadOnlyList<HeldCheckLedgerRollupEntry> HeldCheckLedgerEntries
    {
        get => heldCheckLedgerEntries;
        set => heldCheckLedgerEntries = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>Inventory-upload second-pass delta when findings were regenerated (DX-60).</summary>
    public HeldCheckSecondPassSummary? HeldCheckSecondPass
    {
        get;
        set;
    }

    /// <summary>Grounded prose assumptions that did not all become contradiction findings (DX-61).</summary>
    private IReadOnlyList<ProseAssumptionRegisterEntry> proseAssumptionRegisterEntries = [];

    public IReadOnlyList<ProseAssumptionRegisterEntry> ProseAssumptionRegisterEntries
    {
        get => proseAssumptionRegisterEntries;
        set => proseAssumptionRegisterEntries = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>Upload asks derived from NotVerifiable prose assumptions (DX-66).</summary>
    private IReadOnlyList<ProseAssumptionHeldCheckAsk> proseAssumptionHeldCheckAsks = [];

    public IReadOnlyList<ProseAssumptionHeldCheckAsk> ProseAssumptionHeldCheckAsks
    {
        get => proseAssumptionHeldCheckAsks;
        set => proseAssumptionHeldCheckAsks = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
