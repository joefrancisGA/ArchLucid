namespace ArchLucid.Decisioning.Findings;

/// <summary>Insight-density score rollup for one <see cref="Finding.EngineType" />.</summary>
public sealed class InsightDensityEngineDistributionRow
{
    public string EngineType
    {
        get;
        init;
    } = null!;

    public int FindingCount
    {
        get;
        init;
    }

    public int MinScore
    {
        get;
        init;
    }

    public int MedianScore
    {
        get;
        init;
    }

    public int MaxScore
    {
        get;
        init;
    }

    /// <summary>
    ///     Count of findings whose computed score is strictly below the demotion threshold.
    ///     Typed-engine-protected findings are never demoted in production — this is advisory only.
    /// </summary>
    public int WouldDemoteIfUnprotectedCount
    {
        get;
        init;
    }
}
