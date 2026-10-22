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

        HashSet<string> existingNodeIds = baseGraph.Nodes
            .Select(static node => NormalizeNodeId(node.NodeId))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<GraphNode> mergedNodes = [.. baseGraph.Nodes];

        foreach (GraphNode inventoryNode in inventoryOverlay.Nodes)
        {
            if (existingNodeIds.Contains(NormalizeNodeId(inventoryNode.NodeId)))
            {
                continue;
            }

            GraphNode normalizedNode = NormalizeOverlayNode(inventoryNode);
            mergedNodes.Add(normalizedNode);
            existingNodeIds.Add(NormalizeNodeId(normalizedNode.NodeId));
        }

        HashSet<string> edgeKeys = baseGraph.Edges
            .Select(static edge => BuildEdgeKey(edge))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<GraphEdge> mergedEdges = [.. baseGraph.Edges];

        foreach (GraphEdge inventoryEdge in inventoryOverlay.Edges)
        {
            if (!existingNodeIds.Contains(NormalizeNodeId(inventoryEdge.FromNodeId))
                || !existingNodeIds.Contains(NormalizeNodeId(inventoryEdge.ToNodeId)))
            {
                continue;
            }

            string edgeKey = BuildEdgeKey(inventoryEdge);

            if (!edgeKeys.Add(edgeKey))
            {
                continue;
            }

            mergedEdges.Add(NormalizeOverlayEdge(inventoryEdge));
        }

        List<string> warnings = MergeWarnings(baseGraph.Warnings, inventoryOverlay.Warnings);

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

    private static List<string> MergeWarnings(
        IReadOnlyList<string> baseWarnings,
        IReadOnlyList<string> overlayWarnings)
    {
        HashSet<string> seen = new(StringComparer.OrdinalIgnoreCase);
        List<string> merged = [];

        foreach (string warning in baseWarnings)
        {
            string normalized = NormalizeWarning(warning);

            if (normalized.Length == 0 || !seen.Add(normalized))
            {
                continue;
            }

            merged.Add(normalized);
        }

        foreach (string warning in overlayWarnings)
        {
            string normalized = NormalizeWarning(warning);

            if (normalized.Length == 0 || !seen.Add(normalized))
            {
                continue;
            }

            merged.Add(normalized);
        }

        return merged;
    }

    private static string NormalizeWarning(string? warning) => (warning ?? string.Empty).Trim();

    private static string NormalizeNodeId(string nodeId) => nodeId.Trim();

    private static string BuildEdgeKey(GraphEdge edge) =>
        $"{NormalizeNodeId(edge.FromNodeId)}|{NormalizeNodeId(edge.ToNodeId)}|{NormalizeEdgeType(edge.EdgeType)}";

    private static string NormalizeEdgeType(string? edgeType) => (edgeType ?? string.Empty).Trim();

    private static GraphNode NormalizeOverlayNode(GraphNode node) =>
        new()
        {
            NodeId = NormalizeNodeId(node.NodeId),
            NodeType = node.NodeType,
            Label = node.Label,
            Category = node.Category,
            SourceType = node.SourceType,
            SourceId = node.SourceId,
            ReasoningTrace = node.ReasoningTrace,
            Properties = node.Properties is null || node.Properties.Count == 0
                ? []
                : NormalizeOverlayPropertyBag(node.Properties),
        };

    private static GraphEdge NormalizeOverlayEdge(GraphEdge edge) =>
        new()
        {
            EdgeId = edge.EdgeId,
            FromNodeId = NormalizeNodeId(edge.FromNodeId),
            ToNodeId = NormalizeNodeId(edge.ToNodeId),
            EdgeType = NormalizeEdgeType(edge.EdgeType),
            Label = edge.Label,
            Weight = edge.Weight,
            InferenceSource = edge.InferenceSource,
            ProvenanceKind = edge.ProvenanceKind,
            DeclaredConnectionId = edge.DeclaredConnectionId,
            ReasoningTrace = edge.ReasoningTrace,
            Properties = edge.Properties is null || edge.Properties.Count == 0
                ? []
                : NormalizeOverlayPropertyBag(edge.Properties),
        };

    private static Dictionary<string, string> NormalizeOverlayPropertyBag(IReadOnlyDictionary<string, string> properties)
    {
        Dictionary<string, string> normalized = new(StringComparer.OrdinalIgnoreCase);

        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (string.IsNullOrWhiteSpace(entry.Key))
            {
                continue;
            }

            string key = entry.Key.Trim();
            string value = string.IsNullOrWhiteSpace(entry.Value)
                ? string.Empty
                : entry.Value.Trim();

            if (string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            if (normalized.TryGetValue(key, out string? existing)
                && !string.Equals(existing, value, StringComparison.Ordinal))
            {
                throw new ArgumentException(
                    "Inventory overlay properties contain duplicate keys that collide under ordinal case-insensitive comparison.");
            }

            normalized[key] = value;
        }

        return normalized;
    }
}
