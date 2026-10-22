namespace ArchLucid.Decisioning.Findings;

/// <summary>Attribution rollup for one <see cref="Finding.EngineType" /> within a policy pack snapshot.</summary>
public sealed class PolicyPackAttributionEngineRow
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

    public int AttributableFindingCount
    {
        get;
        init;
    }

    public double AttributionPercentage
    {
        get;
        init;
    }
}