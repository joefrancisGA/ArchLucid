namespace ArchLucid.Decisioning.Findings;

/// <summary>Snapshot-level frontier-baseline delta signal (novelty vs a competent baseline).</summary>
public sealed class FrontierDeltaSignal
{
    public int TotalFindingCount
    {
        get;
        init;
    }

    public int CoveredByBaselineCount
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

    public List<FrontierDeltaEngineRow> ByEngine
    {
        get;
        init;
    } = [];
}
