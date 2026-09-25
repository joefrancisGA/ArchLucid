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

                string? endpointArmId = ResolveNsgAssociationEndpointArmId(association);

                if (string.IsNullOrWhiteSpace(endpointArmId))
                {
                    continue;
                }

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

        string nodeArmId = ArmResourceIdNormalizer.Normalize(ReadArmId(graphNode));
        AddForEndpoint(nodeArmId);

        string? subnetArmId = ResolveSubnetArmIdForGraphNode(graph, graphNode);

        if (!string.IsNullOrWhiteSpace(subnetArmId))
        {
            AddForEndpoint(subnetArmId);
        }

        return attachments;
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

    private static string? ResolveNsgAssociationEndpointArmId(
        AzureInventoryNsgAssociation association)
    {
        // Preserve NIC identity. Collapsing to the VM owner would merge rules from
        // unrelated NICs when a VM has more than one network interface.
        return association.TargetArmId;
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
