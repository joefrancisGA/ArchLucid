namespace ArchLucid.Decisioning.Findings;

using ArchLucid.Contracts.Findings;

/// <summary>Derive-at-read inputs for measurement-floor honesty (DX-15).</summary>
public sealed class InsightDensityMeasurementFloorContext
{
    public int ActorNodeCount
    {
        get;
        init;
    }

    public bool AnalysisStagesComplete
    {
        get;
        init;
    }

    /// <summary>Premium judge cap skips persisted on <see cref="Contracts.Findings.InsightDensityCurationSummary" /> when available.</summary>
    public int? JudgeSkippedByCap
    {
        get;
        init;
    }

    /// <summary>Configured Premium judge cap before remaining-budget shrink (DX-62).</summary>
    public int? JudgeConfiguredCap
    {
        get;
        init;
    }

    /// <summary>Effective Premium judge cap after remaining-budget shrink (DX-62).</summary>
    public int? JudgeEffectiveCap
    {
        get;
        init;
    }

    /// <summary>Ranked missing-input rollup from held-check ledger (DX-52).</summary>
    public IReadOnlyList<HeldCheckLedgerRollupEntry> HeldCheckLedgerEntries
    {
        get;
        init;
    } = [];

    /// <summary>Inventory-upload second-pass summary when findings were regenerated (DX-60).</summary>
    public HeldCheckSecondPassSummary? HeldCheckSecondPass
    {
        get;
        init;
    }

    /// <summary>Upload asks from NotVerifiable prose assumptions (DX-66).</summary>
    public IReadOnlyList<ProseAssumptionHeldCheckAsk> ProseAssumptionHeldCheckAsks
    {
        get;
        init;
    } = [];

    public static IReadOnlyList<string> DeriveSkippedActorEngineTypes(
        int actorNodeCount,
        bool analysisStagesComplete)
    {
        if (!analysisStagesComplete || actorNodeCount > 0)
        {
            return [];
        }

        return ActorDependentFindingEngineTypes.All;
    }
}
