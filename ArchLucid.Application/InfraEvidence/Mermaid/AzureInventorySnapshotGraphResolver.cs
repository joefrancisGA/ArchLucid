using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

public sealed class AzureInventorySnapshotGraphResolver(
    IAzureInventorySnapshotRepository snapshotRepository) : IAzureInventorySnapshotGraphResolver
{
    private readonly IAzureInventorySnapshotRepository _snapshotRepository =
        snapshotRepository ?? throw new ArgumentNullException(nameof(snapshotRepository));

    public async Task<AzureInventorySnapshotGraphResolveResult> TryResolveGraphAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (snapshotId == Guid.Empty)
        {
            return new AzureInventorySnapshotGraphResolveResult
            {
                Succeeded = false,
                ErrorMessage = "Snapshot id is required.",
            };
        }

        AzureInventorySnapshotDetailReadModel? snapshot =
            await _snapshotRepository.TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);

        if (snapshot is null)
        {
            return new AzureInventorySnapshotGraphResolveResult
            {
                Succeeded = false,
                ErrorMessage = $"Snapshot '{snapshotId}' was not found.",
            };
        }

        GraphSnapshot graph = BuildGraph(snapshot);

        return new AzureInventorySnapshotGraphResolveResult
        {
            Succeeded = true,
            Graph = graph,
        };
    }

    private static GraphSnapshot BuildGraph(AzureInventorySnapshotDetailReadModel snapshot)
    {
        Dictionary<string, string> nodeIdByArmId = new(StringComparer.OrdinalIgnoreCase);
        List<GraphNode> nodes = [];

        HashSet<string> seenNodeIds = new(StringComparer.Ordinal);

        foreach (AzureInventoryResourceRecord resource in snapshot.Resources
                     .OrderBy(candidate => ReadAzureResourceId(candidate), StringComparer.Ordinal))
        {
            string nodeId = ResolveNodeId(resource);
            string azureResourceId = ReadAzureResourceId(resource);

            if (!string.IsNullOrWhiteSpace(azureResourceId))
            {
                nodeIdByArmId[azureResourceId] = nodeId;
            }

            if (!seenNodeIds.Add(nodeId))
            {
                continue;
            }

            GraphNode node = new()
            {
                NodeId = nodeId,
                NodeType = GraphNodeTypes.TopologyResource,
                Label = ResolveLabel(resource),
                Category = AzureInventoryTopologyCategory.Resolve(ReadResourceType(resource)),
                SourceType = "azure-inventory-snapshot",
                SourceId = string.IsNullOrWhiteSpace(azureResourceId) ? null : azureResourceId,
            };

            if (!string.IsNullOrWhiteSpace(azureResourceId))
            {
                node.Properties["arm.id"] = azureResourceId;
            }

            string resourceType = ReadResourceType(resource);

            if (!string.IsNullOrWhiteSpace(resourceType))
            {
                node.Properties["arm.type"] = resourceType;
            }

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
                     .OrderBy(candidate => ReadRelationshipArmId(candidate.FromAzureResourceId), StringComparer.Ordinal)
                     .ThenBy(candidate => ReadRelationshipArmId(candidate.ToAzureResourceId), StringComparer.Ordinal)
                     .ThenBy(candidate => ReadRelationshipArmId(candidate.RelationshipType), StringComparer.Ordinal))
        {
            string fromArmId = ReadRelationshipArmId(relationship.FromAzureResourceId);
            string toArmId = ReadRelationshipArmId(relationship.ToAzureResourceId);

            if (!nodeIdByArmId.TryGetValue(fromArmId, out string? fromNodeId)
                || !nodeIdByArmId.TryGetValue(toArmId, out string? toNodeId))
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
            GraphSnapshotId = snapshot.Header.SnapshotId,
            ContextSnapshotId = snapshot.Header.SnapshotId,
            RunId = Guid.Empty,
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

        if (!string.IsNullOrWhiteSpace(resource.AzureResourceId))
        {
            return MermaidIdSanitizer.Sanitize(resource.AzureResourceId);
        }

        // Materialized rows can exist before cloud-resource linkage; keep graph compile deterministic.
        return $"resource-row-{resource.ResourceRowId:D}";
    }

    private static string ResolveLabel(AzureInventoryResourceRecord resource)
    {
        string armId = ReadAzureResourceId(resource);

        if (!string.IsNullOrWhiteSpace(armId))
        {
            int lastSlash = armId.LastIndexOf('/');

            if (lastSlash >= 0 && lastSlash < armId.Length - 1)
            {
                return armId[(lastSlash + 1)..];
            }
        }

        string resourceType = ReadResourceType(resource);

        if (!string.IsNullOrWhiteSpace(resourceType))
        {
            return resourceType;
        }

        return $"resource-row-{resource.ResourceRowId:D}";
    }

    private static string ReadAzureResourceId(AzureInventoryResourceRecord resource)
    {
        return resource.AzureResourceId ?? string.Empty;
    }

    private static string ReadResourceType(AzureInventoryResourceRecord resource)
    {
        return resource.ResourceType ?? string.Empty;
    }

    private static string ReadRelationshipArmId(string? armId)
    {
        return armId ?? string.Empty;
    }

}
