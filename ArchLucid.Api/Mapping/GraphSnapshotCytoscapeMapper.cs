using ArchLucid.Api.Models.Graph;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Api.Mapping;

/// <summary>Maps hydrated <see cref="GraphSnapshot" /> payloads into <see cref="CytoscapeInteractiveGraphResponse"/>.</summary>
public static class GraphSnapshotCytoscapeMapper
{
    public static CytoscapeInteractiveGraphResponse ToInteractiveResponse(GraphSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        List<CytoscapeNodeElement> nodes = snapshot.Nodes.ConvertAll(ToNodeElement);
        List<CytoscapeEdgeElement> edges = snapshot.Edges.ConvertAll(ToEdgeElement);

        return new CytoscapeInteractiveGraphResponse
        {
            GraphSnapshotId = snapshot.GraphSnapshotId,
            RunId = snapshot.RunId,
            Elements = new CytoscapeElementsGroup
            {
                Nodes = nodes,
                Edges = edges,
            },
        };
    }

    private static CytoscapeNodeElement ToNodeElement(GraphNode n)
    {
        return new CytoscapeNodeElement
        {
            Data = new CytoscapeNodeData
            {
                Id = n.NodeId,
                Label = n.Label,
                NodeType = n.NodeType,
                Category = n.Category,
                SourceEntityId = n.SourceId,
            },
        };
    }

    private static CytoscapeEdgeElement ToEdgeElement(GraphEdge e)
    {
        return new CytoscapeEdgeElement
        {
            Data = new CytoscapeEdgeData
            {
                Id = e.EdgeId,
                Source = e.FromNodeId,
                Target = e.ToNodeId,
                Label = e.Label,
                EdgeType = e.EdgeType,
            },
        };
    }
}
