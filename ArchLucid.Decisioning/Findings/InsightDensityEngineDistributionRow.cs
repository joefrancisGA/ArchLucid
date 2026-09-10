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
    ///     Count of findings that would demote under the production predicate at the live
    ///     <see cref="ArchLucid.Core.Findings.InsightDensityGateOptions.DemotionThreshold" />.
    ///     Applies to agent and typed-engine findings (ADR 0070).
    /// </summary>
    public int WouldDemoteIfUnprotectedCount
    {
        get;
        init;
    }

    public int GenericAdviceCount
    {
        get;
        init;
    }

    public int NoConcreteEvidenceCount
    {
        get;
        init;
    }

    public int NoArchitectureAnchorCount
    {
        get;
        init;
    }

    /// <summary>Findings penalized for high or moderate duplication.</summary>
    public int DuplicationCount
    {
        get;
        init;
    }

    /// <summary>
    ///     Advisory count: same demotion predicate evaluated at threshold 65 for measurement only.
    ///     Production <see cref="ArchLucid.Core.Findings.InsightDensityGateOptions.DemotionThreshold" />
    ///     remains unchanged until DX-59.
    /// </summary>
    public int WouldDemoteAt65Count
    {
        get;
        init;
    }
}
