using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Collapses duplicate snapshot edges that share the same endpoints so cited placement hops
///     win over collocation guesses before diagram-mode filtering.
/// </summary>
internal static class AzureInventorySnapshotGraphEdgeRoleDeduplicator
{
    public static void Deduplicate(List<GraphEdge> edges, HashSet<string> edgeKeys)
    {
        ArgumentNullException.ThrowIfNull(edges);
        ArgumentNullException.ThrowIfNull(edgeKeys);

        RemoveWeakerEndpointDuplicates(edges);
        RebuildEdgeKeys(edges, edgeKeys);
    }

    private static void RemoveWeakerEndpointDuplicates(List<GraphEdge> edges)
    {
        List<GraphEdge> snapshot = edges.ToList();
        HashSet<int> removeIndexes = [];

        foreach (IGrouping<string, GraphEdge> group in snapshot.GroupBy(
                     edge => BuildEndpointKey(edge.FromNodeId, edge.ToNodeId),
                     StringComparer.Ordinal))
        {
            List<GraphEdge> members = group.ToList();

            if (members.Count < 2)
            {
                continue;
            }

            GraphEdge? citedPlacement = members.FirstOrDefault(AzureInventorySnapshotCitedEdgePolicy.IsCitedPlacement);

            if (citedPlacement is null)
            {
                continue;
            }

            foreach (GraphEdge candidate in members)
            {
                if (ReferenceEquals(candidate, citedPlacement))
                {
                    continue;
                }

                if (ShouldDropForCitedPlacement(candidate))
                {
                    int index = edges.IndexOf(candidate);

                    if (index >= 0)
                    {
                        removeIndexes.Add(index);
                    }
                }
            }
        }

        foreach (int index in removeIndexes.OrderByDescending(value => value))
        {
            edges.RemoveAt(index);
        }
    }

    private static bool ShouldDropForCitedPlacement(GraphEdge edge)
    {
        if (AzureInventorySnapshotCitedEdgePolicy.IsCitedPlacement(edge))
        {
            return false;
        }

        return string.Equals(edge.EdgeType, GraphEdgeTypes.ConnectsTo, StringComparison.OrdinalIgnoreCase)
               || string.Equals(edge.Label, InventoryDiagramRelationshipLabelTexts.AppToKeyVaultRefLabel, StringComparison.OrdinalIgnoreCase);
    }

    private static void RebuildEdgeKeys(List<GraphEdge> edges, HashSet<string> edgeKeys)
    {
        edgeKeys.Clear();

        foreach (GraphEdge edge in edges)
        {
            string edgeKey = $"{edge.FromNodeId}|{edge.ToNodeId}|{edge.EdgeType}";
            edgeKeys.Add(edgeKey);
        }
    }

    private static string BuildEndpointKey(string fromNodeId, string toNodeId)
    {
        return $"{fromNodeId}|{toNodeId}";
    }
}
