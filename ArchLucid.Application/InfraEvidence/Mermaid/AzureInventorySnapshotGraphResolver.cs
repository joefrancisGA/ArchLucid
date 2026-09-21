using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

public sealed class AzureInventorySnapshotGraphResolver(
    IAzureInventorySnapshotRepository snapshotRepository) : IAzureInventorySnapshotGraphResolver
{
    private const double EffectiveControlEdgeWeight = 0.5d;

    private readonly IAzureInventorySnapshotRepository _snapshotRepository =
        snapshotRepository ?? throw new ArgumentNullException(nameof(snapshotRepository));

    public async Task<AzureInventorySnapshotGraphResolveResult> TryResolveGraphAsync(
        ScopeContext scope,
        Guid snapshotId,
        bool includeNeverShowArmTypes = false,
        bool retainIdentityDiagramArmTypes = false,
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

        GraphSnapshot graph = BuildGraph(snapshot, includeNeverShowArmTypes, retainIdentityDiagramArmTypes);

        return new AzureInventorySnapshotGraphResolveResult
        {
            Succeeded = true,
            Graph = graph,
            Snapshot = snapshot,
        };
    }

    private static GraphSnapshot BuildGraph(
        AzureInventorySnapshotDetailReadModel snapshot,
        bool includeNeverShowArmTypes,
        bool retainIdentityDiagramArmTypes)
    {
        // Hydrate peering edges from the captured package, including NeverShow peering
        // children, then project nodes to the visible inventory for diagram compile.
        AzureInventorySnapshotDetailReadModel graphSnapshot = includeNeverShowArmTypes
            ? snapshot
            : AzureInventoryVisibleSnapshotProjection.Apply(snapshot, retainIdentityDiagramArmTypes);

        Dictionary<string, string> nodeIdByArmId = new(StringComparer.OrdinalIgnoreCase);
        List<GraphNode> nodes = [];

        HashSet<string> seenNodeIds = new(StringComparer.Ordinal);

        foreach (AzureInventoryResourceRecord resource in graphSnapshot.Resources
                     .OrderBy(candidate => ReadAzureResourceId(candidate), StringComparer.Ordinal))
        {
            string nodeId = ResolveNodeId(resource);
            string azureResourceId = ReadAzureResourceId(resource);

            if (!string.IsNullOrWhiteSpace(azureResourceId))
            {
                string normalizedArmId = ArmResourceIdNormalizer.Normalize(azureResourceId);
                nodeIdByArmId[normalizedArmId] = nodeId;
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

        foreach (AzureInventoryResourceRelationshipReadModel relationship in graphSnapshot.Relationships
                     .OrderBy(candidate => ReadRelationshipArmId(candidate.FromAzureResourceId), StringComparer.Ordinal)
                     .ThenBy(candidate => ReadRelationshipArmId(candidate.ToAzureResourceId), StringComparer.Ordinal)
                     .ThenBy(candidate => ReadRelationshipArmId(candidate.RelationshipType), StringComparer.Ordinal))
        {
            string fromArmId = ArmResourceIdNormalizer.Normalize(relationship.FromAzureResourceId);
            string toArmId = ArmResourceIdNormalizer.Normalize(relationship.ToAzureResourceId);
            bool isPeering = AzureInventoryRelationshipAssociationTypes.IsVnetPeeringRelationship(
                relationship.RelationshipType,
                relationship.InferenceSource);

            if (isPeering)
            {
                EnsurePeeringEndpointNode(fromArmId, nodeIdByArmId, nodes, seenNodeIds);
                EnsurePeeringEndpointNode(toArmId, nodeIdByArmId, nodes, seenNodeIds);
            }

            AzureInventorySnapshotExternalSourceNodeHydrator.EnsureExternalSourceNode(
                fromArmId,
                nodes,
                seenNodeIds,
                nodeIdByArmId);
            AzureInventorySnapshotExternalSourceNodeHydrator.EnsureExternalSourceNode(
                toArmId,
                nodes,
                seenNodeIds,
                nodeIdByArmId);

            if (!AzureInventoryArmEndpointNodeResolver.TryResolveExactOrAncestorNodeId(
                    nodeIdByArmId,
                    fromArmId,
                    out string fromNodeId))
            {
                continue;
            }

            string edgeType = ResolveRelationshipEdgeType(relationship);

            foreach (string toNodeId in AzureInventoryArmEndpointNodeResolver.ResolveRelatedNodeIds(
                         nodeIdByArmId,
                         toArmId))
            {
                if (string.Equals(fromNodeId, toNodeId, StringComparison.Ordinal))
                {
                    continue;
                }

                string edgeKey = $"{fromNodeId}|{toNodeId}|{edgeType}";

                if (!edgeKeys.Add(edgeKey))
                {
                    continue;
                }

                edges.Add(new GraphEdge
                {
                    EdgeId = $"edge-{edgeKey}",
                    FromNodeId = fromNodeId,
                    ToNodeId = toNodeId,
                    EdgeType = edgeType,
                    Label = edgeType,
                    Weight = ResolveEdgeWeight(relationship.InferenceSource),
                    InferenceSource = relationship.InferenceSource,
                    ProvenanceKind = relationship.ProvenanceKind.ToString(),
                    DeclaredConnectionId = relationship.DeclaredConnectionId?.ToString(),
                });
            }
        }

        AzureInventorySnapshotVnetPeeringEdgeHydrator.AddMissingPeeringEdges(
            snapshot,
            nodeIdByArmId,
            nodes,
            seenNodeIds,
            edges,
            edgeKeys);
        AzureInventorySnapshotPrivateEndpointEdgeHydrator.AddMissingTargetEdges(
            snapshot,
            nodeIdByArmId,
            edges,
            edgeKeys);
        AzureInventorySnapshotSubnetPlacementEdgeHydrator.AddMissingPlacementEdges(
            snapshot,
            nodeIdByArmId,
            edges,
            edgeKeys);
        AzureInventorySnapshotParentChildEdgeHydrator.AddMissingContainsEdges(
            nodeIdByArmId,
            edges,
            edgeKeys);

        DateTime createdUtc = graphSnapshot.Header.CapturedUtc ?? graphSnapshot.Header.CreatedUtc;

        return new GraphSnapshot
        {
            GraphSnapshotId = graphSnapshot.Header.SnapshotId,
            ContextSnapshotId = graphSnapshot.Header.SnapshotId,
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

    private static string ResolveRelationshipEdgeType(AzureInventoryResourceRelationshipReadModel relationship)
    {
        ArgumentNullException.ThrowIfNull(relationship);

        if (!string.IsNullOrWhiteSpace(relationship.RelationshipType))
        {
            return relationship.RelationshipType.Trim();
        }

        if (!string.IsNullOrWhiteSpace(relationship.InferenceSource))
        {
            return relationship.InferenceSource.Trim();
        }

        return string.Empty;
    }

    private static double ResolveEdgeWeight(string? inferenceSource)
    {
        if (string.IsNullOrWhiteSpace(inferenceSource))
        {
            return 1.0d;
        }

        if (inferenceSource.Equals(GraphEdgeInferenceSources.InventoryEffectiveNsg, StringComparison.OrdinalIgnoreCase)
            || inferenceSource.Equals(GraphEdgeInferenceSources.InventoryEffectiveRoutes, StringComparison.OrdinalIgnoreCase))
        {
            return EffectiveControlEdgeWeight;
        }

        return 1.0d;
    }

    private static void EnsurePeeringEndpointNode(
        string normalizedArmId,
        Dictionary<string, string> nodeIdByArmId,
        List<GraphNode> nodes,
        HashSet<string> seenNodeIds)
    {
        if (string.IsNullOrWhiteSpace(normalizedArmId) || nodeIdByArmId.ContainsKey(normalizedArmId))
        {
            return;
        }

        GraphNode stub = ExecutiveVnetPeeringStubNodeFactory.Create(normalizedArmId);

        if (seenNodeIds.Add(stub.NodeId))
        {
            nodes.Add(stub);
        }

        nodeIdByArmId[normalizedArmId] = stub.NodeId;
    }

}
