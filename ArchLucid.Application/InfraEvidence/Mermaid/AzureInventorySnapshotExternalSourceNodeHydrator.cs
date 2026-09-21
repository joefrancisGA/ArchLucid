using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Ensures synthetic ADF external-source nodes exist when relationships reference them.
/// </summary>
internal static class AzureInventorySnapshotExternalSourceNodeHydrator
{
    public static void EnsureExternalSourceNodes(
        List<GraphNode> nodes,
        HashSet<string> seenNodeIds,
        Dictionary<string, string> nodeIdByArmId,
        IEnumerable<AzureInventoryResourceRelationshipReadModel> relationships)
    {
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(seenNodeIds);
        ArgumentNullException.ThrowIfNull(nodeIdByArmId);
        ArgumentNullException.ThrowIfNull(relationships);

        foreach (AzureInventoryResourceRelationshipReadModel relationship in relationships)
        {
            EnsureExternalSourceNode(relationship.FromAzureResourceId, nodes, seenNodeIds, nodeIdByArmId);
            EnsureExternalSourceNode(relationship.ToAzureResourceId, nodes, seenNodeIds, nodeIdByArmId);
        }
    }

    public static void EnsureExternalSourceNode(
        string? armId,
        List<GraphNode> nodes,
        HashSet<string> seenNodeIds,
        Dictionary<string, string> nodeIdByArmId)
    {
        if (string.IsNullOrWhiteSpace(armId))
        {
            return;
        }

        string normalized = ArmResourceIdNormalizer.Normalize(armId);

        if (!AzureInventoryAdfExternalSourceNodeFactory.IsExternalSourceNodeId(normalized)
            || nodeIdByArmId.ContainsKey(normalized))
        {
            return;
        }

        if (!AzureInventoryAdfExternalSourceNodeFactory.TryParseNodeKey(
                normalized,
                out _,
                out string linkedServiceName))
        {
            return;
        }

        GraphNode externalNode = AzureInventoryAdfExternalSourceNodeFactory.CreateGraphNode(
            normalized,
            linkedServiceName,
            linkedServiceType: null,
            targetHost: null);

        if (seenNodeIds.Add(externalNode.NodeId))
        {
            nodes.Add(externalNode);
        }

        nodeIdByArmId[normalized] = externalNode.NodeId;
    }
}
