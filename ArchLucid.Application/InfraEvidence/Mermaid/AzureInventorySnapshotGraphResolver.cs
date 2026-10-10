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
            await _snapshotRepository.TryGetCanonicalSnapshotDetailAsync(scope, snapshotId, cancellationToken);

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

        HydrateSubnetPlacementProperties(graphSnapshot, nodes);
        HydrateContainerImageProperties(graphSnapshot, nodes);

        List<GraphEdge> edges = [];
        HashSet<string> edgeKeys = new(StringComparer.Ordinal);

        HashSet<string> collectedArmIds = AzureInventoryVisibleSnapshotProjection.BuildVisibleArmIdSet(snapshot.Resources);
        HashSet<string> hiddenArmIds = new(collectedArmIds, StringComparer.OrdinalIgnoreCase);
        hiddenArmIds.ExceptWith(AzureInventoryVisibleSnapshotProjection.BuildVisibleArmIdSet(graphSnapshot.Resources));

        // Visibility removes collected hidden resources; absent endpoints are retained as references.
        foreach (AzureInventoryResourceRelationshipReadModel relationship in snapshot.Relationships
                     .OrderBy(candidate => ReadRelationshipArmId(candidate.FromAzureResourceId), StringComparer.Ordinal)
                     .ThenBy(candidate => ReadRelationshipArmId(candidate.ToAzureResourceId), StringComparer.Ordinal)
                     .ThenBy(candidate => ReadRelationshipArmId(candidate.RelationshipType), StringComparer.Ordinal))
        {
            string fromArmId = ArmResourceIdNormalizer.Normalize(relationship.FromAzureResourceId);
            string toArmId = ArmResourceIdNormalizer.Normalize(relationship.ToAzureResourceId);
            if (!includeNeverShowArmTypes
                && (AzureInventoryReferencedEndpointNodeFactory.IsHiddenEndpoint(fromArmId, collectedArmIds, hiddenArmIds, retainIdentityDiagramArmTypes)
                    || AzureInventoryReferencedEndpointNodeFactory.IsHiddenEndpoint(toArmId, collectedArmIds, hiddenArmIds, retainIdentityDiagramArmTypes)))
            {
                continue;
            }

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
                nodeIdByArmId,
                graphSnapshot.AdfExternalSources);
            AzureInventorySnapshotExternalSourceNodeHydrator.EnsureExternalSourceNode(
                toArmId,
                nodes,
                seenNodeIds,
                nodeIdByArmId,
                graphSnapshot.AdfExternalSources);

            if (!AzureInventoryArmEndpointNodeResolver.TryResolveExactOrAncestorNodeId(nodeIdByArmId, fromArmId, out _))
            {
                AzureInventoryReferencedEndpointNodeFactory.EnsureNode(fromArmId, nodeIdByArmId, nodes, seenNodeIds);
            }

            IReadOnlyList<string> toNodeIds = AzureInventoryReferencedEndpointNodeFactory.ResolveTargetNodeIds(
                toArmId, nodeIdByArmId, nodes, seenNodeIds);

            if (!AzureInventoryArmEndpointNodeResolver.TryResolveExactOrAncestorNodeId(
                    nodeIdByArmId,
                    fromArmId,
                    out string fromNodeId))
            {
                continue;
            }

            string edgeType = ResolveRelationshipEdgeType(relationship);

            foreach (string toNodeId in toNodeIds)
            {
                AzureInventorySnapshotGraphEdgeAppender.TryAddRelationship(
                    edges, edgeKeys, fromNodeId, toNodeId, edgeType, relationship);
            }
        }

        AzureInventorySnapshotRoleAssignmentEdgeHydrator.AddMissingRoleAssignmentEdges(
            graphSnapshot,
            nodes,
            nodeIdByArmId,
            edges,
            edgeKeys);
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
            nodes,
            seenNodeIds,
            edges,
            edgeKeys,
            collectedArmIds,
            hiddenArmIds,
            includeNeverShowArmTypes,
            retainIdentityDiagramArmTypes);
        AzureInventorySnapshotSubnetPlacementEdgeHydrator.AddMissingPlacementEdges(
            snapshot,
            nodeIdByArmId,
            edges,
            edgeKeys);
        AzureInventorySnapshotPropertyArmIdEdgeHydrator.AddMissingPropertyArmIdEdges(
            snapshot,
            nodeIdByArmId,
            edges,
            edgeKeys);
        AzureInventorySnapshotPublicIpParentEdgeHydrator.AddMissingParentEdges(
            snapshot,
            nodeIdByArmId,
            edges,
            edgeKeys);
        AzureInventorySnapshotLogicAppConnectionHydrator.AddMissingConnectionEdges(
            snapshot,
            nodeIdByArmId,
            edges,
            edgeKeys);
        AzureInventorySnapshotDatabricksAccessConnectorEdgeHydrator.AddMissingAccessConnectorEdges(
            snapshot,
            nodeIdByArmId,
            nodes,
            edges,
            edgeKeys);
        AzureInventorySnapshotHiddenHopComposer.AddComposedEdges(
            nodes,
            edges,
            edgeKeys);
        AzureInventorySnapshotSameResourceGroupEdgeHydrator.AddMissingCollocationEdges(
            snapshot,
            nodeIdByArmId,
            edges,
            edgeKeys);
        AzureInventorySnapshotDiagnosticEdgeHydrator.AddMissingDiagnosticEdges(
            snapshot,
            nodeIdByArmId,
            edges,
            edgeKeys);
        AzureInventorySnapshotRecoveryServicesEdgeHydrator.AddMissingProtectionEdges(
            snapshot,
            nodeIdByArmId,
            edges,
            edgeKeys);
        AzureInventorySnapshotParentChildEdgeHydrator.AddMissingContainsEdges(
            nodeIdByArmId,
            edges,
            edgeKeys);
        AzureInventorySnapshotNodeRelationshipGraphHydrator.Hydrate(snapshot, nodes);
        AzureInventorySnapshotParentAttachmentGraphHydrator.Hydrate(snapshot, nodes);
        AzureInventorySnapshotIndirectRelationshipGraphHydrator.Hydrate(snapshot, nodes, edges);
        AzureInventorySnapshotExternalSourceHostConsolidator.Consolidate(
            graphSnapshot,
            nodes,
            seenNodeIds,
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

    private static void HydrateSubnetPlacementProperties(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<GraphNode> nodes)
    {
        Dictionary<Guid, AzureInventoryResourceRecord> resourcesByRowId = snapshot.Resources
            .GroupBy(resource => resource.ResourceRowId)
            .ToDictionary(group => group.Key, group => group.First());
        Dictionary<string, GraphNode> nodesByArmId = nodes
            .Where(node => node.Properties.TryGetValue("arm.id", out string? armId)
                && !string.IsNullOrWhiteSpace(armId))
            .ToDictionary(
                node => ArmResourceIdNormalizer.Normalize(node.Properties["arm.id"]),
                node => node,
                StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourcePropertyReadModel property in snapshot.Properties)
        {
            if (property.IsRedacted
                || string.IsNullOrWhiteSpace(property.PropertyValue)
                || !resourcesByRowId.TryGetValue(property.ResourceRowId, out AzureInventoryResourceRecord? resource)
                || !nodesByArmId.TryGetValue(
                    ArmResourceIdNormalizer.Normalize(resource.AzureResourceId),
                    out GraphNode? node))
            {
                continue;
            }

            string resourceType = resource.ResourceType ?? string.Empty;
            bool isBastionSubnetProperty =
                resourceType.Contains("bastionHosts", StringComparison.OrdinalIgnoreCase)
                && (property.PropertyKey.Equals("ipConfiguration.subnet.id", StringComparison.OrdinalIgnoreCase)
                    || property.PropertyKey.StartsWith(
                        "ipConfiguration.subnet.id[",
                        StringComparison.OrdinalIgnoreCase)
                    || property.PropertyKey.Equals(
                        InventoryDiagramOrphanedStatePropertyKeys.SkuName,
                        StringComparison.OrdinalIgnoreCase));
            bool isVirtualNetworkSubnetsProperty =
                AzureInventoryVnetPeeringParser.IsVirtualNetworkResourceType(resourceType)
                && property.PropertyKey.Equals("subnets", StringComparison.OrdinalIgnoreCase);
            bool isPublicIpIpConfigurationProperty =
                resourceType.Contains("publicIPAddresses", StringComparison.OrdinalIgnoreCase)
                && (property.PropertyKey.Equals("ipConfiguration.id", StringComparison.OrdinalIgnoreCase)
                    || property.PropertyKey.Equals("natGateway.id", StringComparison.OrdinalIgnoreCase));
            bool isFirewallSubnetProperty =
                resourceType.Contains("azureFirewalls", StringComparison.OrdinalIgnoreCase)
                && (property.PropertyKey.Equals("ipConfigurations", StringComparison.OrdinalIgnoreCase)
                    || property.PropertyKey.Equals(
                        "managementIpConfiguration.subnet.id",
                        StringComparison.OrdinalIgnoreCase)
                    || property.PropertyKey.StartsWith(
                        "ipConfiguration.subnet.id[",
                        StringComparison.OrdinalIgnoreCase));

            if (isBastionSubnetProperty
                || isVirtualNetworkSubnetsProperty
                || isPublicIpIpConfigurationProperty
                || isFirewallSubnetProperty)
            {
                node.Properties[property.PropertyKey] = property.PropertyValue;
            }
        }
    }

    private static void HydrateContainerImageProperties(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<GraphNode> nodes)
    {
        Dictionary<Guid, AzureInventoryResourceRecord> resourcesByRowId = snapshot.Resources
            .GroupBy(resource => resource.ResourceRowId)
            .ToDictionary(group => group.Key, group => group.First());
        Dictionary<string, GraphNode> nodesByArmId = nodes
            .Where(node => node.Properties.TryGetValue("arm.id", out string? armId)
                && !string.IsNullOrWhiteSpace(armId))
            .ToDictionary(
                node => ArmResourceIdNormalizer.Normalize(node.Properties["arm.id"]),
                node => node,
                StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourcePropertyReadModel property in snapshot.Properties)
        {
            if (property.IsRedacted
                || string.IsNullOrWhiteSpace(property.PropertyValue)
                || !resourcesByRowId.TryGetValue(property.ResourceRowId, out AzureInventoryResourceRecord? resource)
                || !nodesByArmId.TryGetValue(
                    ArmResourceIdNormalizer.Normalize(resource.AzureResourceId),
                    out GraphNode? node))
            {
                continue;
            }

            bool isRegistryLoginServer =
                resource.ResourceType.Equals(
                    "Microsoft.ContainerRegistry/registries",
                    StringComparison.OrdinalIgnoreCase)
                && property.PropertyKey.Equals("loginServer", StringComparison.OrdinalIgnoreCase);
            bool isContainerImage =
                property.PropertyKey.StartsWith("container.image[", StringComparison.OrdinalIgnoreCase);

            if (isRegistryLoginServer || isContainerImage)
            {
                node.Properties[property.PropertyKey] = property.PropertyValue;
            }
        }
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
