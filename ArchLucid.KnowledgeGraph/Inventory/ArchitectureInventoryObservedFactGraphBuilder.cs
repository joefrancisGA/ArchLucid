using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph.Diagram;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.KnowledgeGraph.Inventory;

/// <summary>
///     Builds an inventory-only graph overlay with <see cref="StructuredDiagramGraphProvenanceKinds.ObservedFact" /> provenance (AS-050).
/// </summary>
public static class ArchitectureInventoryObservedFactGraphBuilder
{
    public static GraphSnapshot BuildOverlay(
        AzureInventorySnapshotDetailReadModel snapshot,
        Guid runId,
        Guid contextSnapshotId)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        Dictionary<string, string> nodeIdByArmId = new(StringComparer.OrdinalIgnoreCase);
        List<GraphNode> nodes = [];

        foreach (AzureInventoryResourceRecord resource in snapshot.Resources
                     .OrderBy(candidate => candidate.AzureResourceId, StringComparer.Ordinal))
        {
            string nodeId = ResolveNodeId(resource);
            nodeIdByArmId[resource.AzureResourceId] = nodeId;

            GraphNode node = new()
            {
                NodeId = nodeId,
                NodeType = GraphNodeTypes.TopologyResource,
                Label = ResolveLabel(resource),
                Category = ResolveCategory(resource.ResourceType),
                SourceType = ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot,
                SourceId = resource.AzureResourceId,
            };

            node.Properties[StructuredDiagramGraphPropertyKeys.ProvenanceKind] =
                StructuredDiagramGraphProvenanceKinds.ObservedFact;
            node.Properties["arm.id"] = resource.AzureResourceId;
            node.Properties["arm.type"] = resource.ResourceType;
            node.Properties["inventory.snapshotId"] = snapshot.Header.SnapshotId.ToString("D");

            if (!string.IsNullOrWhiteSpace(resource.ResourceGroup))
            {
                node.Properties["arm.resourceGroup"] = resource.ResourceGroup;
            }

            if (!string.IsNullOrWhiteSpace(resource.SubscriptionId))
            {
                node.Properties["arm.subscriptionId"] = resource.SubscriptionId;
            }

            if (!string.IsNullOrWhiteSpace(resource.ParentResourceId))
            {
                node.Properties["arm.parentId"] = resource.ParentResourceId;
            }

            if (resource.CloudResourceId.HasValue)
            {
                node.Properties["cloudResourceId"] = resource.CloudResourceId.Value.ToString("D");
            }

            nodes.Add(node);
        }

        List<GraphEdge> edges = [];
        HashSet<string> edgeKeys = new(StringComparer.Ordinal);

        foreach (AzureInventoryResourceRelationshipReadModel relationship in snapshot.Relationships
                     .OrderBy(candidate => candidate.FromAzureResourceId, StringComparer.Ordinal)
                     .ThenBy(candidate => candidate.ToAzureResourceId, StringComparer.Ordinal)
                     .ThenBy(candidate => candidate.RelationshipType, StringComparer.Ordinal))
        {
            if (!nodeIdByArmId.TryGetValue(relationship.FromAzureResourceId, out string? fromNodeId)
                || !nodeIdByArmId.TryGetValue(relationship.ToAzureResourceId, out string? toNodeId))
            {
                continue;
            }

            string edgeKey = $"{fromNodeId}|{toNodeId}|{relationship.RelationshipType}";

            if (!edgeKeys.Add(edgeKey))
            {
                continue;
            }

            edges.Add(new GraphEdge
            {
                EdgeId = $"edge-{edgeKey}",
                FromNodeId = fromNodeId,
                ToNodeId = toNodeId,
                EdgeType = relationship.RelationshipType,
                Label = relationship.RelationshipType,
                Weight = 1.0,
            });
        }

        DateTime createdUtc = snapshot.Header.CapturedUtc ?? snapshot.Header.CreatedUtc;

        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = contextSnapshotId,
            RunId = runId,
            CreatedUtc = createdUtc,
            Nodes = nodes,
            Edges = edges,
        };
    }

    private static string ResolveNodeId(AzureInventoryResourceRecord resource)
    {
        if (resource.CloudResourceId.HasValue)
        {
            return resource.CloudResourceId.Value.ToString("D");
        }

        return ArchitectureInventoryGraphNodeIdResolver.ResolveFromArmResourceId(resource.AzureResourceId);
    }

    private static string ResolveLabel(AzureInventoryResourceRecord resource)
    {
        string armId = resource.AzureResourceId;
        int lastSlash = armId.LastIndexOf('/');

        if (lastSlash >= 0 && lastSlash < armId.Length - 1)
        {
            return armId[(lastSlash + 1)..];
        }

        return resource.ResourceType;
    }

    private static string ResolveCategory(string resourceType)
    {
        if (resourceType.Contains("/network", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("networksecuritygroups", StringComparison.OrdinalIgnoreCase))
        {
            return GraphTopologyCategories.Network;
        }

        if (resourceType.Contains("/storage", StringComparison.OrdinalIgnoreCase))
        {
            return GraphTopologyCategories.Storage;
        }

        if (resourceType.Contains("/compute", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("sites", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("serverfarms", StringComparison.OrdinalIgnoreCase))
        {
            return GraphTopologyCategories.Compute;
        }

        if (resourceType.Contains("/sql", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("/documentdb", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("/dbfor", StringComparison.OrdinalIgnoreCase))
        {
            return GraphTopologyCategories.Data;
        }

        if (resourceType.Contains("managedidentity", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("authorization", StringComparison.OrdinalIgnoreCase))
        {
            return GraphTopologyCategories.Identity;
        }

        return GraphTopologyCategories.Compute;
    }
}
