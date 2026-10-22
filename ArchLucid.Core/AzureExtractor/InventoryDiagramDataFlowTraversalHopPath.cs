namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Ordered traversal path ending at the last proven hop (NR-07).
/// </summary>
public sealed class InventoryDiagramDataFlowTraversalHopPath
{
    public required string SourceNodeId
    {
        get;
        init;
    }

    public required string TargetNodeId
    {
        get;
        init;
    }

    public IReadOnlyList<string> OrderedHopNodeIds
    {
        get;
        init;
    } = [];

    public IReadOnlyList<InventoryDiagramDataFlowTraversalHopLink> OrderedLinks
    {
        get;
        init;
    } = [];

    public string? MissingHopDescription
    {
        get;
        init;
    }

    public bool HasUnresolvedGap => !string.IsNullOrWhiteSpace(MissingHopDescription);

    public bool ReachesTarget =>
        OrderedLinks.Count > 0
        && string.Equals(OrderedLinks[^1].ToNodeId, TargetNodeId, StringComparison.Ordinal);
}
