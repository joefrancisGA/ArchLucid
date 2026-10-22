namespace ArchLucid.Decisioning.Findings;

/// <summary>Per-engine insight-density score distribution for one findings snapshot.</summary>
public sealed class InsightDensityEngineDistribution
{
    public List<InsightDensityEngineDistributionRow> Rows
    {
        get;
        init;
    } = [];
}
