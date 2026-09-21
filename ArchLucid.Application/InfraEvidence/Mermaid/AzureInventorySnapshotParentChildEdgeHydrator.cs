using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Restores CONTAINS edges from ARM nesting so already-captured snapshots still show
///     VNet→subnet and server→database even when stored parent ids dropped only the name.
/// </summary>
internal static class AzureInventorySnapshotParentChildEdgeHydrator
{
    public static void AddMissingContainsEdges(
        Dictionary<string, string> nodeIdByArmId,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys)
    {
        ArgumentNullException.ThrowIfNull(nodeIdByArmId);
        ArgumentNullException.ThrowIfNull(edges);
        ArgumentNullException.ThrowIfNull(edgeKeys);

        foreach (KeyValuePair<string, string> pair in nodeIdByArmId)
        {
            if (!ArmResourceIdNormalizer.TryGetParentResourceId(pair.Key, out string parentArmId))
            {
                continue;
            }

            string normalizedParent = ArmResourceIdNormalizer.Normalize(parentArmId);

            if (!nodeIdByArmId.TryGetValue(normalizedParent, out string? parentNodeId))
            {
                continue;
            }

            if (string.Equals(parentNodeId, pair.Value, StringComparison.Ordinal))
            {
                continue;
            }

            TryAddContainsEdge(edges, edgeKeys, parentNodeId, pair.Value);
        }
    }

    private static void TryAddContainsEdge(
        List<GraphEdge> edges,
        HashSet<string> edgeKeys,
        string fromNodeId,
        string toNodeId)
    {
        string edgeType = GraphEdgeTypes.Contains;
        string edgeKey = $"{fromNodeId}|{toNodeId}|{edgeType}";

        if (!edgeKeys.Add(edgeKey))
        {
            return;
        }

        edges.Add(new GraphEdge
        {
            EdgeId = $"edge-{edgeKey}",
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = edgeType,
            Label = edgeType,
            Weight = 1.0d,
            InferenceSource = GraphEdgeInferenceSources.InventoryExplicitParentChild,
            ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
        });
    }
}
