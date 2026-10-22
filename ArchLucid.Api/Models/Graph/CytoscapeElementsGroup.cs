namespace ArchLucid.Api.Models.Graph;

public sealed class CytoscapeElementsGroup
{
    public required List<CytoscapeNodeElement> Nodes
    {
        get;
        init;
    }

    public required List<CytoscapeEdgeElement> Edges
    {
        get;
        init;
    }
}
