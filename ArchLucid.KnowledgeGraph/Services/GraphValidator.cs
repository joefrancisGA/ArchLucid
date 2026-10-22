using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Services;

public class GraphValidator : IGraphValidator
{
    public void Validate(GraphSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        HashSet<string> nodeIds = new(
            snapshot.Nodes
                .Select(static node => (node.NodeId ?? string.Empty).Trim())
                .Where(static nodeId => nodeId.Length > 0),
            StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in snapshot.Nodes)
        {
            if (string.IsNullOrWhiteSpace(node.NodeId))
                throw new InvalidOperationException("Graph node NodeId is required.");

            if (string.IsNullOrWhiteSpace(node.NodeType))
                throw new InvalidOperationException($"Graph node '{node.NodeId}' is missing NodeType.");
        }

        foreach (GraphEdge edge in snapshot.Edges)
        {
            if (string.IsNullOrWhiteSpace(edge.EdgeType))
                throw new InvalidOperationException("Graph edge EdgeType is required.");

            string fromNodeId = (edge.FromNodeId ?? string.Empty).Trim();
            string toNodeId = (edge.ToNodeId ?? string.Empty).Trim();

            if (!nodeIds.Contains(fromNodeId))
                throw new InvalidOperationException($"Graph edge source node '{edge.FromNodeId}' does not exist.");

            if (!nodeIds.Contains(toNodeId))
                throw new InvalidOperationException($"Graph edge target node '{edge.ToNodeId}' does not exist.");
        }
    }
}
