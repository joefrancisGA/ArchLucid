using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Indexes NR-02 NSG associations by resolved endpoint ARM id for data-flow annotation (NR-08).
/// </summary>
public static class InventoryDiagramDataFlowNsgAttachmentIndex
{
    public static Dictionary<string, List<InventoryDiagramDataFlowNsgEndpointAttachment>> Build(
        GraphSnapshot graph)
    {
        ArgumentNullException.ThrowIfNull(graph);

        Dictionary<string, List<InventoryDiagramDataFlowNsgEndpointAttachment>> attachmentsByEndpointArmId =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode graphNode in graph.Nodes)
        {
            string armType = ReadArmType(graphNode);

            if (!armType.Equals("Microsoft.Network/networkSecurityGroups", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string nsgArmId = ArmResourceIdNormalizer.Normalize(ReadArmId(graphNode));
            string nsgName = ReadResourceName(nsgArmId);
            IReadOnlyList<AzureInventoryNsgAssociation> associations =
                AzureInventoryNsgAssociationParser.Parse(graphNode.Properties);
            IReadOnlyList<AzureInventoryNsgSecurityRule> rules =
                AzureInventoryNsgSecurityRuleParser.Parse(graphNode.Properties);

            foreach (AzureInventoryNsgAssociation association in associations)
            {
                if (string.IsNullOrWhiteSpace(association.TargetArmId))
                {
                    continue;
                }

                string endpointArmId = ArmResourceIdNormalizer.Normalize(association.TargetArmId);

                InventoryDiagramDataFlowNsgEndpointAttachment attachment = new()
                {
                    NsgArmId = nsgArmId,
                    NsgName = nsgName,
                    AssociationKind = string.IsNullOrWhiteSpace(association.TargetKind)
                        ? AzureInventoryNsgAssociationParser.SubnetKind
                        : association.TargetKind,
                    Rules = rules,
                };

                if (!attachmentsByEndpointArmId.TryGetValue(endpointArmId, out List<InventoryDiagramDataFlowNsgEndpointAttachment>? attachments))
                {
                    attachments = [];
                    attachmentsByEndpointArmId[endpointArmId] = attachments;
                }

                attachments.Add(attachment);
            }
        }

        return attachmentsByEndpointArmId;
    }

    public static string? ResolveSubnetArmIdForGraphNode(GraphSnapshot graph, GraphNode graphNode)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphNode);

        Dictionary<string, string> subnetArmIdByNodeId = BuildSubnetArmIdByNodeId(graph);

        if (subnetArmIdByNodeId.TryGetValue(graphNode.NodeId, out string? subnetArmId))
        {
            return subnetArmId;
        }

        string armId = ArmResourceIdNormalizer.Normalize(ReadArmId(graphNode));

        return ReadArmType(graphNode).Contains("/subnets", StringComparison.OrdinalIgnoreCase)
            ? armId
            : null;
    }

    public static IReadOnlyList<InventoryDiagramDataFlowNsgEndpointAttachment> ResolveEndpointAttachments(
        GraphSnapshot graph,
        GraphNode graphNode,
        IReadOnlyDictionary<string, List<InventoryDiagramDataFlowNsgEndpointAttachment>> attachmentsByEndpointArmId)
    {
        return ResolveEndpointAttachments(graph, graphNode, null, attachmentsByEndpointArmId);
    }

    public static IReadOnlyList<InventoryDiagramDataFlowNsgEndpointAttachment> ResolveEndpointAttachments(
        GraphSnapshot graph,
        GraphNode graphNode,
        GraphNode? peerNode,
        IReadOnlyDictionary<string, List<InventoryDiagramDataFlowNsgEndpointAttachment>> attachmentsByEndpointArmId)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphNode);
        ArgumentNullException.ThrowIfNull(attachmentsByEndpointArmId);

        List<InventoryDiagramDataFlowNsgEndpointAttachment> attachments = [];
        HashSet<string> seenKeys = new(StringComparer.OrdinalIgnoreCase);

        void AddForEndpoint(string? endpointArmId)
        {
            if (string.IsNullOrWhiteSpace(endpointArmId)
                || !attachmentsByEndpointArmId.TryGetValue(endpointArmId, out List<InventoryDiagramDataFlowNsgEndpointAttachment>? endpointAttachments))
            {
                return;
            }

            foreach (InventoryDiagramDataFlowNsgEndpointAttachment attachment in endpointAttachments)
            {
                string key = $"{attachment.NsgArmId}|{attachment.AssociationKind}";

                if (seenKeys.Add(key))
                {
                    attachments.Add(attachment);
                }
            }
        }

        if (IsVirtualMachineNode(graphNode))
        {
            GraphNode? facingNicNode = ResolveFacingNicForVm(graph, graphNode, peerNode);

            if (facingNicNode is not null)
            {
                string nicArmId = ArmResourceIdNormalizer.Normalize(ReadArmId(facingNicNode));
                AddForEndpoint(nicArmId);

                string? subnetArmId = ResolveSubnetArmIdForGraphNode(graph, facingNicNode);

                if (!string.IsNullOrWhiteSpace(subnetArmId))
                {
                    AddForEndpoint(subnetArmId);
                }
            }

            return attachments;
        }

        if (IsNetworkInterfaceNode(graphNode))
        {
            string nicArmId = ArmResourceIdNormalizer.Normalize(ReadArmId(graphNode));
            AddForEndpoint(nicArmId);

            string? subnetArmId = ResolveSubnetArmIdForGraphNode(graph, graphNode);

            if (!string.IsNullOrWhiteSpace(subnetArmId))
            {
                AddForEndpoint(subnetArmId);
            }

            return attachments;
        }

        string nodeArmId = ArmResourceIdNormalizer.Normalize(ReadArmId(graphNode));
        AddForEndpoint(nodeArmId);

        string? resolvedSubnetArmId = ResolveSubnetArmIdForGraphNode(graph, graphNode);

        if (!string.IsNullOrWhiteSpace(resolvedSubnetArmId))
        {
            AddForEndpoint(resolvedSubnetArmId);
        }

        return attachments;
    }

    public static GraphNode? ResolveFacingNicForVm(
        GraphSnapshot graph,
        GraphNode vmNode,
        GraphNode? peerNode)
    {
        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        List<GraphNode> nicNodes = GetNicNodesForVm(graph, vmNode, graphNodesById);

        if (nicNodes.Count == 0)
        {
            return null;
        }

        if (nicNodes.Count == 1)
        {
            return nicNodes[0];
        }

        if (peerNode is null)
        {
            return null;
        }

        string? peerSubnetArmId = ResolveSubnetArmIdForGraphNode(graph, peerNode);

        if (string.IsNullOrWhiteSpace(peerSubnetArmId))
        {
            return null;
        }

        Dictionary<string, string> subnetArmIdByNodeId = BuildSubnetArmIdByNodeId(graph);

        List<GraphNode> nicsOnPeerSubnet = nicNodes
            .Where(nicNode => subnetArmIdByNodeId.TryGetValue(nicNode.NodeId, out string? nicSubnetArmId)
                && string.Equals(nicSubnetArmId, peerSubnetArmId, StringComparison.OrdinalIgnoreCase))
            .ToList();

        return nicsOnPeerSubnet.Count == 1
            ? nicsOnPeerSubnet[0]
            : null;
    }

    private static List<GraphNode> GetNicNodesForVm(
        GraphSnapshot graph,
        GraphNode vmNode,
        IReadOnlyDictionary<string, GraphNode> graphNodesById)
    {
        List<GraphNode> nicNodes = [];

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.VmToNic, StringComparison.OrdinalIgnoreCase)
                || !string.Equals(edge.FromNodeId, vmNode.NodeId, StringComparison.Ordinal))
            {
                continue;
            }

            if (graphNodesById.TryGetValue(edge.ToNodeId, out GraphNode? nicNode))
            {
                nicNodes.Add(nicNode);
            }
        }

        nicNodes.Sort((left, right) => string.Compare(left.NodeId, right.NodeId, StringComparison.Ordinal));
        return nicNodes;
    }

    private static bool IsVirtualMachineNode(GraphNode graphNode)
    {
        return ReadArmType(graphNode).Contains("/virtualMachines", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsNetworkInterfaceNode(GraphNode graphNode)
    {
        return ReadArmType(graphNode).Contains("/networkInterfaces", StringComparison.OrdinalIgnoreCase);
    }

    private static Dictionary<string, string> BuildSubnetArmIdByNodeId(GraphSnapshot graph)
    {
        Dictionary<string, string> subnetArmIdByNodeId = new(StringComparer.Ordinal);

        foreach (GraphNode node in graph.Nodes)
        {
            string armId = ArmResourceIdNormalizer.Normalize(ReadArmId(node));

            if (string.IsNullOrWhiteSpace(armId))
            {
                continue;
            }

            if (ReadArmType(node).Contains("/subnets", StringComparison.OrdinalIgnoreCase))
            {
                subnetArmIdByNodeId[node.NodeId] = armId;
            }
        }

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.NicToSubnet, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!subnetArmIdByNodeId.TryGetValue(edge.ToNodeId, out string? subnetArmId))
            {
                continue;
            }

            subnetArmIdByNodeId[edge.FromNodeId] = subnetArmId;
        }

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!subnetArmIdByNodeId.TryGetValue(edge.ToNodeId, out string? subnetArmId))
            {
                continue;
            }

            subnetArmIdByNodeId[edge.FromNodeId] = subnetArmId;
        }

        return subnetArmIdByNodeId;
    }

    private static string ReadArmType(GraphNode node)
    {
        if (node.Properties.TryGetValue("arm.type", out string? armType) && !string.IsNullOrWhiteSpace(armType))
        {
            return armType;
        }

        return node.NodeType;
    }

    private static string ReadArmId(GraphNode node)
    {
        if (node.Properties.TryGetValue("arm.id", out string? armId) && !string.IsNullOrWhiteSpace(armId))
        {
            return armId;
        }

        return node.SourceId ?? node.NodeId;
    }

    private static string ReadResourceName(string armId)
    {
        int lastSlash = armId.LastIndexOf('/');

        return lastSlash < 0 || lastSlash >= armId.Length - 1
            ? armId
            : armId[(lastSlash + 1)..];
    }
}
