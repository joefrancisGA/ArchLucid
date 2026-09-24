using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Opt-in Recovery Services vault nodes cited by collected <c>PROTECTS</c> edges (RSV-04).</summary>
internal static class DiagramRecoveryServicesIncluder
{
    public static List<GraphNode> Include(GraphSnapshot graph, List<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(nodes);

        HashSet<string> includedNodeIds = nodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        Dictionary<string, GraphNode> nodesById = graph.Nodes.ToDictionary(
            node => node.NodeId,
            StringComparer.Ordinal);

        List<GraphNode> expanded = nodes.ToList();

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!IsCollectedProtectionEdge(edge))
            {
                continue;
            }

            if (!includedNodeIds.Contains(edge.ToNodeId))
            {
                continue;
            }

            if (includedNodeIds.Contains(edge.FromNodeId))
            {
                continue;
            }

            if (!nodesById.TryGetValue(edge.FromNodeId, out GraphNode? vaultNode)
                || !IsRecoveryServicesVault(vaultNode))
            {
                continue;
            }

            expanded.Add(vaultNode);
            includedNodeIds.Add(vaultNode.NodeId);
        }

        return expanded
            .OrderBy(node => DiagramAstGraphNodeClassifier.ReadArmId(node), StringComparer.Ordinal)
            .ToList();
    }

    public static List<GraphEdge> IncludeEdges(GraphSnapshot graph, List<GraphEdge> edges, HashSet<string> includedNodeIds)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(edges);
        ArgumentNullException.ThrowIfNull(includedNodeIds);

        HashSet<string> edgeIds = edges
            .Select(edge => edge.EdgeId)
            .ToHashSet(StringComparer.Ordinal);

        List<GraphEdge> expanded = edges.ToList();

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!IsCollectedProtectionEdge(edge))
            {
                continue;
            }

            if (!includedNodeIds.Contains(edge.FromNodeId) || !includedNodeIds.Contains(edge.ToNodeId))
            {
                continue;
            }

            if (!edgeIds.Add(edge.EdgeId))
            {
                continue;
            }

            expanded.Add(edge);
        }

        return expanded
            .OrderBy(edge => edge.EdgeId, StringComparer.Ordinal)
            .ToList();
    }

    private static bool IsCollectedProtectionEdge(GraphEdge edge)
    {
        if (!string.Equals(edge.EdgeType, GraphEdgeTypes.Protects, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        string? inferenceSource = edge.InferenceSource;

        return !string.IsNullOrWhiteSpace(inferenceSource)
            && (inferenceSource.Equals(GraphEdgeInferenceSources.InventoryRecoveryServicesProtects, StringComparison.OrdinalIgnoreCase)
                || inferenceSource.Equals(GraphEdgeInferenceSources.InventoryRecoveryServicesReplicates, StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsRecoveryServicesVault(GraphNode node)
    {
        return string.Equals(
            DiagramAstGraphNodeClassifier.ReadArmType(node),
            AzureInventoryRecoveryServices.VaultResourceType,
            StringComparison.OrdinalIgnoreCase);
    }
}
