using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Resolves cited parent ARM ids for NR-03 child resources.</summary>
public static class AzureInventoryParentAttachmentParentResolver
{
    public static AzureInventoryParentAttachmentResolveResult Resolve(
        GraphNode childNode,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, HashSet<string>> publicIpArmIdToReferencingParentArmIds)
    {
        ArgumentNullException.ThrowIfNull(childNode);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(publicIpArmIdToReferencingParentArmIds);

        string? armResourceType = ReadArmType(childNode);

        if (!InventoryDiagramParentAttachmentClassifier.TryClassify(
                armResourceType,
                out InventoryDiagramParentAttachmentCategory category))
        {
            return new AzureInventoryParentAttachmentResolveResult();
        }

        if (category == InventoryDiagramParentAttachmentCategory.ImageTemplate)
        {
            return new AzureInventoryParentAttachmentResolveResult
            {
                ExcludeFromTopology = true,
            };
        }

        Dictionary<string, string> properties = childNode.Properties;
        string childArmId = ArmResourceIdNormalizer.Normalize(ReadArmId(childNode));
        HashSet<string> parentArmIds = new(StringComparer.OrdinalIgnoreCase);
        string? externalTargetArmId = null;

        switch (category)
        {
            case InventoryDiagramParentAttachmentCategory.PublicIp:
                AddPublicIpParents(childNode, graph, publicIpArmIdToReferencingParentArmIds, childArmId, parentArmIds);
                break;
            case InventoryDiagramParentAttachmentCategory.NamespaceChild:
            case InventoryDiagramParentAttachmentCategory.Component:
            case InventoryDiagramParentAttachmentCategory.Service:
                AddArmParentId(properties, category, parentArmIds);
                AddExplicitParentChildEdges(childNode, graph, category, parentArmIds);
                break;
            case InventoryDiagramParentAttachmentCategory.RestorePointCollection:
                AddRestorePointCollectionParent(properties, parentArmIds);
                break;
            case InventoryDiagramParentAttachmentCategory.AccessConnector:
                AddAccessConnectorParents(properties, parentArmIds, ref externalTargetArmId);
                break;
        }

        return new AzureInventoryParentAttachmentResolveResult
        {
            ParentArmIds = parentArmIds.OrderBy(id => id, StringComparer.Ordinal).ToList(),
            ExternalTargetArmId = externalTargetArmId,
        };
    }

    public static Dictionary<string, HashSet<string>> BuildPublicIpReferencingParentArmIdMap(IReadOnlyList<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(nodes);

        Dictionary<string, HashSet<string>> map = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in nodes)
        {
            string parentArmId = ArmResourceIdNormalizer.Normalize(ReadArmId(node));

            if (string.IsNullOrWhiteSpace(parentArmId))
            {
                continue;
            }

            foreach (string publicIpArmId in AzureInventoryPublicIpReferenceParser.Parse(node.Properties))
            {
                if (!map.TryGetValue(publicIpArmId, out HashSet<string>? parents))
                {
                    parents = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    map[publicIpArmId] = parents;
                }

                parents.Add(parentArmId);
            }
        }

        return map;
    }

    private static void AddPublicIpParents(
        GraphNode childNode,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, HashSet<string>> publicIpArmIdToReferencingParentArmIds,
        string childArmId,
        ISet<string> parentArmIds)
    {
        if (publicIpArmIdToReferencingParentArmIds.TryGetValue(childArmId, out HashSet<string>? referencingParents))
        {
            foreach (string parentArmId in referencingParents)
            {
                parentArmIds.Add(parentArmId);
            }
        }

        if (childNode.Properties.TryGetValue("ipConfiguration.id", out string? ipConfigurationId)
            && !string.IsNullOrWhiteSpace(ipConfigurationId))
        {
            string? associatedResourceId = TryResolveAssociatedResourceFromIpConfiguration(ipConfigurationId);

            if (!string.IsNullOrWhiteSpace(associatedResourceId))
            {
                parentArmIds.Add(ArmResourceIdNormalizer.Normalize(associatedResourceId));
            }
        }

        Dictionary<string, GraphNode> nodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!string.Equals(edge.FromNodeId, childNode.NodeId, StringComparison.Ordinal))
            {
                continue;
            }

            if (!IsPublicIpExposesNetworkInterfaceEdge(edge, nodesById))
            {
                continue;
            }

            if (!nodesById.TryGetValue(edge.ToNodeId, out GraphNode? nicNode))
            {
                continue;
            }

            string nicArmId = ArmResourceIdNormalizer.Normalize(ReadArmId(nicNode));

            if (!string.IsNullOrWhiteSpace(nicArmId))
            {
                parentArmIds.Add(nicArmId);
            }
        }
    }

    private static void AddArmParentId(
        IReadOnlyDictionary<string, string> properties,
        InventoryDiagramParentAttachmentCategory category,
        ISet<string> parentArmIds)
    {
        for (int index = 0; ; index++)
        {
            string key =
                $"{InventoryDiagramParentAttachmentPropertyKeys.ParentArmIdPrefix}{index}{InventoryDiagramParentAttachmentPropertyKeys.ParentArmIdSuffix}";

            if (!properties.TryGetValue(key, out string? parentArmId)
                || string.IsNullOrWhiteSpace(parentArmId))
            {
                break;
            }

            TryAddValidatedParent(category, parentArmId, parentArmIds);
        }

        if (properties.TryGetValue("arm.parentId", out string? armParentId)
            && !string.IsNullOrWhiteSpace(armParentId))
        {
            TryAddValidatedParent(category, armParentId, parentArmIds);
        }
    }

    private static void AddExplicitParentChildEdges(
        GraphNode childNode,
        GraphSnapshot graph,
        InventoryDiagramParentAttachmentCategory category,
        ISet<string> parentArmIds)
    {
        string childArmId = ArmResourceIdNormalizer.Normalize(ReadArmId(childNode));

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!string.Equals(edge.ToNodeId, childNode.NodeId, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!string.Equals(edge.EdgeType, "CONTAINS", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(
                    edge.InferenceSource,
                    "inventory-explicit-parent-child",
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!graph.Nodes.Any(node => node.NodeId == edge.FromNodeId))
            {
                continue;
            }

            GraphNode parentNode = graph.Nodes.First(node => node.NodeId == edge.FromNodeId);
            string parentArmId = ArmResourceIdNormalizer.Normalize(ReadArmId(parentNode));

            if (!string.IsNullOrWhiteSpace(parentArmId)
                && !string.Equals(parentArmId, childArmId, StringComparison.OrdinalIgnoreCase))
            {
                TryAddValidatedParent(category, parentArmId, parentArmIds);
            }
        }
    }

    private static void AddRestorePointCollectionParent(
        IReadOnlyDictionary<string, string> properties,
        ISet<string> parentArmIds)
    {
        string? sourceArmId = AzureInventoryRestorePointCollectionSourceParser.Parse(properties);

        if (!string.IsNullOrWhiteSpace(sourceArmId))
        {
            TryAddValidatedParent(
                InventoryDiagramParentAttachmentCategory.RestorePointCollection,
                sourceArmId,
                parentArmIds);
        }
    }

    private static void AddAccessConnectorParents(
        IReadOnlyDictionary<string, string> properties,
        ISet<string> parentArmIds,
        ref string? externalTargetArmId)
    {
        string? parentArmId = AzureInventoryAccessConnectorTargetParser.ParseParentArmId(properties);

        if (!string.IsNullOrWhiteSpace(parentArmId))
        {
            TryAddValidatedParent(
                InventoryDiagramParentAttachmentCategory.AccessConnector,
                parentArmId,
                parentArmIds);
        }

        externalTargetArmId = AzureInventoryAccessConnectorTargetParser.ParseExternalTargetArmId(properties);
    }

    private static void TryAddValidatedParent(
        InventoryDiagramParentAttachmentCategory category,
        string parentArmId,
        ISet<string> parentArmIds)
    {
        string normalized = ArmResourceIdNormalizer.Normalize(parentArmId);

        if (string.IsNullOrWhiteSpace(normalized))
        {
            return;
        }

        string? parentArmType = TryReadArmTypeFromArmId(normalized);

        if (!InventoryDiagramParentAttachmentClassifier.IsValidParentArmType(category, parentArmType))
        {
            return;
        }

        parentArmIds.Add(normalized);
    }

    private static bool IsPublicIpExposesNetworkInterfaceEdge(
        GraphEdge edge,
        IReadOnlyDictionary<string, GraphNode> nodesById)
    {
        if (!nodesById.TryGetValue(edge.ToNodeId, out GraphNode? toNode))
        {
            return false;
        }

        string? toArmType = ReadArmType(toNode);

        return string.Equals(edge.EdgeType, "EXPOSES", StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, "inventory-public-ip", StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PublicIpToNic, StringComparison.OrdinalIgnoreCase)
            || toArmType?.Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase) == true;
    }

    private static string? TryResolveAssociatedResourceFromIpConfiguration(string ipConfigurationId)
    {
        string normalized = ipConfigurationId.Trim();
        int ipConfigurationsIndex = normalized.IndexOf("/ipConfigurations/", StringComparison.OrdinalIgnoreCase);

        if (ipConfigurationsIndex <= 0)
        {
            return null;
        }

        return normalized[..ipConfigurationsIndex];
    }

    private static string? TryReadArmTypeFromArmId(string armId)
    {
        string[] segments = armId.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        int providersIndex = Array.FindIndex(segments, segment => segment.Equals("providers", StringComparison.OrdinalIgnoreCase));

        if (providersIndex < 0 || providersIndex + 2 >= segments.Length)
        {
            return null;
        }

        List<string> armTypeSegments =
        [
            segments[providersIndex + 1],
            segments[providersIndex + 2],
        ];

        for (int index = providersIndex + 4; index < segments.Length; index += 2)
        {
            armTypeSegments.Add(segments[index]);
        }

        return string.Join("/", armTypeSegments);
    }

    private static string ReadArmId(GraphNode node)
    {
        return node.Properties.TryGetValue("arm.id", out string? armId) ? armId : string.Empty;
    }

    private static string? ReadArmType(GraphNode node)
    {
        return node.Properties.TryGetValue("arm.type", out string? armType) ? armType : null;
    }
}
