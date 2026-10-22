namespace ArchLucid.Core.AzureExtractor;

/// <summary>A cited indirect relationship edge resolved for NR-04 diagram projection.</summary>
public sealed class InventoryDiagramIndirectRelationshipResolvedEdge
{
    public required string FromDiagramNodeId
    {
        get;
        init;
    }

    public required string ToDiagramNodeId
    {
        get;
        init;
    }

    public required string InferenceSource
    {
        get;
        init;
    }

    public required string RelationshipLabel
    {
        get;
        init;
    }

    public required InventoryDiagramEvidenceCurrency EvidenceCurrency
    {
        get;
        init;
    }

    public IReadOnlyList<string> DerivedHopLabels
    {
        get;
        init;
    } = [];
}
