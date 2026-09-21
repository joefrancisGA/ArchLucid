using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Resolves network-interface graph nodes to their owning compute resource for diagram collapse.
/// </summary>
internal static class DiagramNicOwnerResolver
{
    public static Dictionary<string, string> BuildNicNodeIdToOwnerNodeIdMap(
        IReadOnlyList<GraphEdge> edges,
        IReadOnlyList<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(edges);
        ArgumentNullException.ThrowIfNull(nodes);

        Dictionary<string, GraphNode> nodesById = nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        Dictionary<string, string> nicNodeIdToOwnerNodeId = new(StringComparer.Ordinal);

        foreach (GraphEdge edge in edges)
        {
            if (edge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
            {
                continue;
            }

            if (!IsVmToNicEdge(edge))
            {
                continue;
            }

            if (!nodesById.TryGetValue(edge.FromNodeId, out GraphNode? ownerNode)
                || !nodesById.TryGetValue(edge.ToNodeId, out GraphNode? nicNode))
            {
                continue;
            }

            if (!IsVirtualMachineNode(ownerNode) || !IsNetworkInterfaceNode(nicNode))
            {
                continue;
            }

            nicNodeIdToOwnerNodeId[edge.ToNodeId] = edge.FromNodeId;
        }

        return nicNodeIdToOwnerNodeId;
    }

    public static bool IsVmToNicEdge(GraphEdge edge)
    {
        ArgumentNullException.ThrowIfNull(edge);

        if (string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.VmToNic, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.Label, AzureInventoryRelationshipAssociationTypes.VmToNic, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryVmNic, StringComparison.OrdinalIgnoreCase)
            && string.Equals(edge.EdgeType, GraphEdgeTypes.ConnectsTo, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsNicToSubnetEdge(GraphEdge edge)
    {
        ArgumentNullException.ThrowIfNull(edge);

        if (string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.NicToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.Label, AzureInventoryRelationshipAssociationTypes.NicToSubnet, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryNicSubnet, StringComparison.OrdinalIgnoreCase)
            && string.Equals(edge.EdgeType, GraphEdgeTypes.ConnectsTo, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsNetworkInterfaceNode(GraphNode node)
    {
        string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);
        string armId = DiagramAstGraphNodeClassifier.ReadArmId(node);

        if (!string.IsNullOrWhiteSpace(armType)
            && armType.Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return armId.Contains("/networkInterfaces/", StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsPublicIpAddressNode(GraphNode node)
    {
        string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);
        string armId = DiagramAstGraphNodeClassifier.ReadArmId(node);

        if (!string.IsNullOrWhiteSpace(armType)
            && armType.Contains("publicIPAddresses", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return armId.Contains("/publicIPAddresses/", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsVirtualMachineNode(GraphNode node)
    {
        return DiagramAstGraphNodeClassifier.ReadArmType(node)
            .Contains("virtualMachines", StringComparison.OrdinalIgnoreCase);
    }
}
