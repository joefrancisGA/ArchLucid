using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
/// Composes hidden NIC and private-endpoint paths before diagram-mode filtering.
/// </summary>
internal static class AzureInventorySnapshotHiddenHopComposer
{
    public static void AddComposedEdges(
        IReadOnlyList<GraphNode> nodes,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys)
    {
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(edges);
        ArgumentNullException.ThrowIfNull(edgeKeys);

        Dictionary<string, GraphNode> nodesById = nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
        Dictionary<string, string> nicOwners = BuildNicOwners(edges, nodesById);

        AddNicOwnerEdges(edges, edgeKeys, nicOwners);
        AddPrivateEndpointPlacementEdges(nodes, edges, edgeKeys);
    }

    private static Dictionary<string, string> BuildNicOwners(
        IReadOnlyList<GraphEdge> edges,
        IReadOnlyDictionary<string, GraphNode> nodesById)
    {
        Dictionary<string, string> owners = new(StringComparer.Ordinal);

        foreach (GraphEdge edge in edges)
        {
            if ((!IsVmToNicEdge(edge) && !IsPrivateEndpointToNicEdge(edge))
                || !nodesById.TryGetValue(edge.ToNodeId, out GraphNode? nic)
                || !IsNetworkInterfaceNode(nic))
            {
                continue;
            }

            owners[edge.ToNodeId] = edge.FromNodeId;
        }

        return owners;
    }

    private static void AddNicOwnerEdges(
        List<GraphEdge> edges,
        HashSet<string> edgeKeys,
        IReadOnlyDictionary<string, string> nicOwners)
    {
        foreach (GraphEdge edge in edges.ToList())
        {
            if (!IsNicToSubnetEdge(edge)
                || !nicOwners.TryGetValue(edge.FromNodeId, out string? ownerNodeId))
            {
                continue;
            }

            AzureInventorySnapshotGraphEdgeAppender.TryAdd(
                edges,
                edgeKeys,
                ownerNodeId,
                edge.ToNodeId,
                AzureInventoryRelationshipAssociationTypes.NicToSubnet,
                edge.InferenceSource ?? GraphEdgeInferenceSources.InventoryNicSubnet,
                label: "in",
                provenanceKind: edge.ProvenanceKind ?? ProvenanceKind.DerivedFact.ToString());
        }
    }

    private static void AddPrivateEndpointPlacementEdges(
        IReadOnlyList<GraphNode> nodes,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys)
    {
        Dictionary<string, GraphNode> nodesById = nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
        List<GraphEdge> targetEdges = edges
            .Where(IsPrivateEndpointTargetEdge)
            .ToList();

        foreach (GraphEdge targetEdge in targetEdges)
        {
            foreach (GraphEdge placementEdge in edges.ToList().Where(edge =>
                         string.Equals(edge.FromNodeId, targetEdge.FromNodeId, StringComparison.Ordinal)
                         && IsPrivateEndpointPlacementEdge(edge)))
            {
                string? vnetNodeId = ResolvePrivateEndpointVnetNodeId(
                    placementEdge.ToNodeId,
                    nodesById,
                    edges);

                if (string.IsNullOrWhiteSpace(vnetNodeId)
                    || string.Equals(targetEdge.ToNodeId, vnetNodeId, StringComparison.Ordinal))
                {
                    continue;
                }

                AzureInventorySnapshotGraphEdgeAppender.TryAdd(
                    edges,
                    edgeKeys,
                    targetEdge.ToNodeId,
                    vnetNodeId,
                    GraphEdgeTypes.ConnectsTo,
                    GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                    label: "private endpoint",
                    provenanceKind: ProvenanceKind.DerivedFact.ToString());
            }
        }
    }

    private static string? ResolvePrivateEndpointVnetNodeId(
        string placementNodeId,
        IReadOnlyDictionary<string, GraphNode> nodesById,
        IReadOnlyList<GraphEdge> edges)
    {
        if (!nodesById.TryGetValue(placementNodeId, out GraphNode? placementNode))
        {
            return null;
        }

        string armId = placementNode.Properties.TryGetValue("arm.id", out string? value)
            ? value
            : string.Empty;

        if (armId.Contains("/virtualNetworks/", StringComparison.OrdinalIgnoreCase)
            && !armId.Contains("/subnets/", StringComparison.OrdinalIgnoreCase))
        {
            return placementNodeId;
        }

        foreach (GraphNode candidate in nodesById.Values)
        {
            string candidateArmId = candidate.Properties.TryGetValue("arm.id", out string? candidateValue)
                ? candidateValue
                : string.Empty;

            if (candidateArmId.Contains("/virtualNetworks/", StringComparison.OrdinalIgnoreCase)
                && !candidateArmId.Contains("/subnets/", StringComparison.OrdinalIgnoreCase)
                && ArmResourceIdNormalizer.IsDescendantOf(armId, candidateArmId))
            {
                return candidate.NodeId;
            }
        }

        foreach (GraphEdge edge in edges)
        {
            if (!string.Equals(edge.FromNodeId, placementNodeId, StringComparison.Ordinal)
                || !IsNicToSubnetEdge(edge)
                || !nodesById.ContainsKey(edge.ToNodeId))
            {
                continue;
            }

            string? vnetNodeId = ResolvePrivateEndpointVnetNodeId(edge.ToNodeId, nodesById, edges);
            if (!string.IsNullOrWhiteSpace(vnetNodeId))
            {
                return vnetNodeId;
            }
        }

        return null;
    }

    private static bool IsVmToNicEdge(GraphEdge edge)
    {
        return string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryVmNic, StringComparison.OrdinalIgnoreCase)
               || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.VmToNic, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsNetworkInterfaceNode(GraphNode node)
    {
        string armType = node.Properties.TryGetValue("arm.type", out string? value)
            ? value
            : string.Empty;
        string armId = node.Properties.TryGetValue("arm.id", out string? id)
            ? id
            : string.Empty;

        return armType.Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase)
               || armId.Contains("/networkInterfaces/", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsNicToSubnetEdge(GraphEdge edge)
    {
        return string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryNicSubnet, StringComparison.OrdinalIgnoreCase)
               || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.NicToSubnet, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPrivateEndpointToNicEdge(GraphEdge edge)
    {
        return string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryPeNic, StringComparison.OrdinalIgnoreCase)
               || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PeToNic, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPrivateEndpointTargetEdge(GraphEdge edge)
    {
        return string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryPrivateEndpoint, StringComparison.OrdinalIgnoreCase)
               || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPrivateEndpointPlacementEdge(GraphEdge edge)
    {
        return string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryPeSubnet, StringComparison.OrdinalIgnoreCase)
               || string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryPeNic, StringComparison.OrdinalIgnoreCase)
               || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase)
               || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PeToNic, StringComparison.OrdinalIgnoreCase);
    }
}
