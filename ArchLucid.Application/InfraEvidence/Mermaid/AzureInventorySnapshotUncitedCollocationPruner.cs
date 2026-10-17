using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Drops same-RG collocation guesses when a cited hop already explains the source node, and removes
///     cross-resource-group edges that lack a cited hop (IDX-03).
/// </summary>
internal static class AzureInventorySnapshotUncitedCollocationPruner
{
    public static void Prune(
        IReadOnlyList<GraphNode> nodes,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys)
    {
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(edges);
        ArgumentNullException.ThrowIfNull(edgeKeys);

        Dictionary<string, string> resourceGroupByNodeId = BuildResourceGroupIndex(nodes);
        HashSet<int> removeIndexes = [];

        for (int index = 0; index < edges.Count; index++)
        {
            GraphEdge edge = edges[index];

            if (AzureInventorySnapshotCitedHopPredicate.IsUncitedCollocationGuess(edge)
                && AzureInventorySnapshotCitedHopPredicate.HasCitedHopFrom(edges, edge.FromNodeId))
            {
                removeIndexes.Add(index);
                continue;
            }

            if (!IsSameResourceGroup(edge, resourceGroupByNodeId)
                && !AzureInventorySnapshotCitedHopPredicate.IsCitedHop(edge))
            {
                removeIndexes.Add(index);
            }
        }

        foreach (int index in removeIndexes.OrderByDescending(value => value))
        {
            edges.RemoveAt(index);
        }

        if (removeIndexes.Count > 0)
        {
            AzureInventorySnapshotGraphEdgeRoleDeduplicator.Deduplicate(edges, edgeKeys);
        }
    }

    private static Dictionary<string, string> BuildResourceGroupIndex(IReadOnlyList<GraphNode> nodes)
    {
        Dictionary<string, string> index = new(StringComparer.Ordinal);

        foreach (GraphNode node in nodes)
        {
            if (node.Properties.TryGetValue("arm.resourceGroup", out string? resourceGroup)
                && !string.IsNullOrWhiteSpace(resourceGroup))
            {
                index[node.NodeId] = resourceGroup;
            }
        }

        return index;
    }

    private static bool IsSameResourceGroup(
        GraphEdge edge,
        IReadOnlyDictionary<string, string> resourceGroupByNodeId)
    {
        if (!resourceGroupByNodeId.TryGetValue(edge.FromNodeId, out string? fromGroup)
            || !resourceGroupByNodeId.TryGetValue(edge.ToNodeId, out string? toGroup))
        {
            return true;
        }

        return string.Equals(fromGroup, toGroup, StringComparison.OrdinalIgnoreCase);
    }
}
