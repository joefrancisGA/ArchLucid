using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.KnowledgeGraph.Inventory;

/// <summary>
///     Merges bound inventory snapshot nodes into an authority review graph (AS-050).
///     Merge order: structured diagram compile (AS-016) and canonical bind (AS-018) run during context graph build;
///     inventory <see cref="Diagram.StructuredDiagramGraphProvenanceKinds.ObservedFact" /> overlay is applied after that
///     resolution step so sealed graphs can cite <c>cloudResourceId</c> without minting prose facts.
/// </summary>
public static class ArchitectureInventoryObservedFactGraphOverlayMerger
{
    public static GraphSnapshot Merge(GraphSnapshot baseGraph, GraphSnapshot inventoryOverlay)
    {
        ArgumentNullException.ThrowIfNull(baseGraph);
        ArgumentNullException.ThrowIfNull(inventoryOverlay);

        if (inventoryOverlay.Nodes.Count == 0 && inventoryOverlay.Edges.Count == 0)
        {
            return baseGraph;
        }

        HashSet<string> existingNodeIds = baseGraph.Nodes
            .Select(static node => node.NodeId)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<GraphNode> mergedNodes = [.. baseGraph.Nodes];

        foreach (GraphNode inventoryNode in inventoryOverlay.Nodes)
        {
            if (existingNodeIds.Contains(inventoryNode.NodeId))
            {
                continue;
            }

            mergedNodes.Add(inventoryNode);
            existingNodeIds.Add(inventoryNode.NodeId);
        }

        HashSet<string> edgeKeys = baseGraph.Edges
            .Select(static edge => $"{edge.FromNodeId}|{edge.ToNodeId}|{edge.EdgeType}")
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<GraphEdge> mergedEdges = [.. baseGraph.Edges];

        foreach (GraphEdge inventoryEdge in inventoryOverlay.Edges)
        {
            if (!existingNodeIds.Contains(inventoryEdge.FromNodeId)
                || !existingNodeIds.Contains(inventoryEdge.ToNodeId))
            {
                continue;
            }

            string edgeKey = $"{inventoryEdge.FromNodeId}|{inventoryEdge.ToNodeId}|{inventoryEdge.EdgeType}";

            if (!edgeKeys.Add(edgeKey))
            {
                continue;
            }

            mergedEdges.Add(inventoryEdge);
        }

        List<string> warnings = inventoryOverlay.Warnings.Count == 0
            ? [.. baseGraph.Warnings]
            : [.. baseGraph.Warnings, .. inventoryOverlay.Warnings];

        return new GraphSnapshot
        {
            GraphSnapshotId = baseGraph.GraphSnapshotId,
            ContextSnapshotId = baseGraph.ContextSnapshotId,
            RunId = baseGraph.RunId,
            CreatedUtc = baseGraph.CreatedUtc,
            SchemaVersion = baseGraph.SchemaVersion,
            Nodes = mergedNodes,
            Edges = mergedEdges,
            Warnings = warnings,
        };
    }
}
