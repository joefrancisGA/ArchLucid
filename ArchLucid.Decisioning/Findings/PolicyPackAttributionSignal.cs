namespace ArchLucid.Decisioning.Findings;

/// <summary>Snapshot-level policy-pack attribution signal (pack rule ids vs finding traces).</summary>
public sealed class PolicyPackAttributionSignal
{
    public int TotalFindingCount
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

    public List<PolicyPackAttributionEngineRow> ByEngine
    {
        get;
        init;
    } = [];
}