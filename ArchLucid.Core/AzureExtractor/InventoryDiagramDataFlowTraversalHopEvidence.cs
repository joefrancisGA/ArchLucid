namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Cited evidence that places a resource on a data-flow traversal path (NR-07).
/// </summary>
public sealed class InventoryDiagramDataFlowTraversalHopEvidence
{
    public required string AssociationType
    {
        get;
        init;
    }

    public string? InferenceSource
    {
        get;
        init;
    }

    public required string DiagramLabel
    {
        get;
        init;
    }
}
