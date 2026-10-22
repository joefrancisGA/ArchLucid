namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     One cited traversal step between two inventoried resources (NR-07).
/// </summary>
public sealed class InventoryDiagramDataFlowTraversalHopLink
{
    public required string FromNodeId
    {
        get;
        init;
    }

    public required string ToNodeId
    {
        get;
        init;
    }

    public required InventoryDiagramDataFlowTraversalHopEvidence Evidence
    {
        get;
        init;
    }
}
