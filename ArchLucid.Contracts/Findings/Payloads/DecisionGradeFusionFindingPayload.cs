namespace ArchLucid.Contracts.Findings.Payloads;

/// <summary>DX-51: synthesis finding that joins Decision-grade rows sharing a graph node.</summary>
public sealed class DecisionGradeFusionFindingPayload
{
    public IReadOnlyList<string> ConstituentFindingIds
    {
        get;
        set;
    } = [];

    public IReadOnlyList<string> SharedNodeIds
    {
        get;
        set;
    } = [];

    public IReadOnlyList<string> SourceEngineTypes
    {
        get;
        set;
    } = [];
}
