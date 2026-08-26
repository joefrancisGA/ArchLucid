namespace ArchLucid.Decisioning.Findings;

/// <summary>Frontier-delta rollup for one <see cref="Finding.EngineType" /> within a snapshot.</summary>
public sealed class FrontierDeltaEngineRow
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

    public int NovelFindingCount
    {
        get;
        init;
    }

    public double NoveltyPercentage
    {
        get;
        init;
    }
}
