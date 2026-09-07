namespace ArchLucid.Decisioning.Findings;

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
