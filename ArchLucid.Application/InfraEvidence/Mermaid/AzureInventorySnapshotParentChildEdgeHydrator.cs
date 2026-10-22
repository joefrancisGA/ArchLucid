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

            AzureInventorySnapshotGraphEdgeAppender.TryAdd(
                edges,
                edgeKeys,
                parentNodeId,
                pair.Value,
                GraphEdgeTypes.Contains,
                GraphEdgeInferenceSources.InventoryExplicitParentChild,
                provenanceKind: ProvenanceKind.ObservedFact.ToString(),
                promoteStrongerProvenance: false);
        }
    }
}
