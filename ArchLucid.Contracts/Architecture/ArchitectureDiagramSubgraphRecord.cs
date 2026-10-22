namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Swimlane / subgraph container within a structured architecture diagram (AS-006).
/// </summary>
public sealed class ArchitectureDiagramSubgraphRecord
{
    public string Id
    {
        get;
        set;
    } = string.Empty;

    public string Label
    {
        get;
        set;
    } = string.Empty;

    public string? ParentSubgraphId
    {
        get;
        set;
    }

    public int OrderKey
    {
        get;
        set;
    }
}
