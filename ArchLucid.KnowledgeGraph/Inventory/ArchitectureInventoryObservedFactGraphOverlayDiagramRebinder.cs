using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph.Diagram;

namespace ArchLucid.KnowledgeGraph.Inventory;

/// <summary>
///     After AS-050 overlay merge, rebinds leftover compiled <c>diagram-node:*</c> topology onto
///     inventory ObservedFact nodes so diagram citations can share snapshot ARM identities (QR-17).
/// </summary>
public static class ArchitectureInventoryObservedFactGraphOverlayDiagramRebinder
{
    public static GraphSnapshot RebindLeftoverDiagramNodes(GraphSnapshot mergedGraph, GraphSnapshot inventoryOverlay)
    {
        ArgumentNullException.ThrowIfNull(mergedGraph);
        ArgumentNullException.ThrowIfNull(inventoryOverlay);

        if (inventoryOverlay.Nodes.Count == 0)
        {
            return mergedGraph;
        }

        List<GraphNode> bindTargets = inventoryOverlay.Nodes
            .Where(IsInventoryObservedFact)
            .ToList();

        if (bindTargets.Count == 0)
        {
            return mergedGraph;
        }

        Dictionary<string, string> diagramNodeIdRemap = new(StringComparer.OrdinalIgnoreCase);
        List<StructuredDiagramCanonicalBinding> bindings = [];
        List<GraphNode> outputNodes = [];

        foreach (GraphNode node in mergedGraph.Nodes)
        {
            if (!IsLeftoverDiagramTopologyNode(node))
            {
                outputNodes.Add(node);
                continue;
            }

            string diagramSourceId = string.IsNullOrWhiteSpace(node.SourceId)
                ? node.NodeId
                : node.SourceId.Trim();

            GraphNode? boundTarget = StructuredDiagramCanonicalBindMatcher.TryBindDiagramNode(
                diagramSourceId,
                node.Label,
                bindTargets);

            if (boundTarget is null)
            {
                outputNodes.Add(node);
                continue;
            }

            string diagramGraphNodeId = node.NodeId.Trim();
            diagramNodeIdRemap[diagramGraphNodeId] = boundTarget.NodeId;
            bindings.Add(new StructuredDiagramCanonicalBinding
            {
                DiagramGraphNodeId = diagramGraphNodeId,
                DiagramSourceId = diagramSourceId,
                CanonicalGraphNodeId = boundTarget.NodeId,
                SourceEvidenceItemId = TryReadSourceEvidenceItemId(node),
            });
        }

        if (bindings.Count == 0)
        {
            return mergedGraph;
        }

        List<GraphEdge> remappedEdges = RemapEdges(mergedGraph.Edges, diagramNodeIdRemap);

        GraphSnapshot rebound = new()
        {
            GraphSnapshotId = mergedGraph.GraphSnapshotId,
            ContextSnapshotId = mergedGraph.ContextSnapshotId,
            RunId = mergedGraph.RunId,
            CreatedUtc = mergedGraph.CreatedUtc,
            SchemaVersion = mergedGraph.SchemaVersion,
            Nodes = outputNodes,
            Edges = remappedEdges,
            Warnings = mergedGraph.Warnings,
        };

        StructuredDiagramCompiledGraphBinder.ApplyBindingsToGraphNodes(rebound.Nodes, bindings);

        return rebound;
    }

    private static bool IsInventoryObservedFact(GraphNode node)
    {
        if (!string.IsNullOrWhiteSpace(node.SourceType)
            && string.Equals(
                node.SourceType.Trim(),
                ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot,
                StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (node.Properties is null)
        {
            return false;
        }

        if (!GraphNodePropertyReader.TryGetPropertyValue(
                node.Properties,
                StructuredDiagramGraphPropertyKeys.ProvenanceKind,
                out string? provenance)
            || !string.Equals(
                provenance,
                StructuredDiagramGraphProvenanceKinds.ObservedFact,
                StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return GraphNodePropertyReader.TryGetPropertyValue(
                   node.Properties,
                   "inventory.snapshotId",
                   out _)
            || GraphNodePropertyReader.TryGetPropertyValue(
                node.Properties,
                "armResourceId",
                out _)
            || GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "arm.id", out _);
    }

    private static bool IsLeftoverDiagramTopologyNode(GraphNode node)
    {
        return node.NodeId.Trim().StartsWith("diagram-node:", StringComparison.Ordinal);
    }

    private static string? TryReadSourceEvidenceItemId(GraphNode diagramNode)
    {
        if (diagramNode.Properties is null)
        {
            return null;
        }

        if (!GraphNodePropertyReader.TryGetPropertyValue(
                diagramNode.Properties,
                StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId,
                out string? evidenceItemId)
            || string.IsNullOrWhiteSpace(evidenceItemId))
        {
            return null;
        }

        return evidenceItemId.Trim();
    }

    private static List<GraphEdge> RemapEdges(
        IReadOnlyList<GraphEdge> edges,
        IReadOnlyDictionary<string, string> diagramNodeIdRemap)
    {
        HashSet<string> edgeKeys = new(StringComparer.OrdinalIgnoreCase);
        List<GraphEdge> remapped = [];

        foreach (GraphEdge edge in edges)
        {
            string fromNodeId = RemapEndpoint(edge.FromNodeId, diagramNodeIdRemap);
            string toNodeId = RemapEndpoint(edge.ToNodeId, diagramNodeIdRemap);

            if (string.Equals(fromNodeId, toNodeId, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string edgeType = (edge.EdgeType ?? string.Empty).Trim();
            string edgeKey = $"{fromNodeId}|{toNodeId}|{edgeType}";

            if (!edgeKeys.Add(edgeKey))
            {
                continue;
            }

            remapped.Add(new GraphEdge
            {
                EdgeId = edge.EdgeId,
                FromNodeId = fromNodeId,
                ToNodeId = toNodeId,
                EdgeType = edgeType,
                Label = edge.Label,
                Weight = edge.Weight,
                InferenceSource = edge.InferenceSource,
                ReasoningTrace = edge.ReasoningTrace,
                Properties = edge.Properties is null
                    ? []
                    : new Dictionary<string, string>(edge.Properties, StringComparer.Ordinal),
            });
        }

        return remapped;
    }

    private static string RemapEndpoint(string nodeId, IReadOnlyDictionary<string, string> diagramNodeIdRemap)
    {
        if (diagramNodeIdRemap.TryGetValue(nodeId, out string? remapped)
            || diagramNodeIdRemap.TryGetValue(nodeId.Trim(), out remapped))
        {
            return remapped.Trim();
        }

        return nodeId.Trim();
    }
}
