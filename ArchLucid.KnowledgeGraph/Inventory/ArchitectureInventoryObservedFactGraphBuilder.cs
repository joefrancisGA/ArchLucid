using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph.Diagram;

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

        snapshot = AzureInventoryVisibleSnapshotProjection.Apply(snapshot);

        Dictionary<string, string> nodeIdByArmId = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, GraphNode> nodeByNormalizedArmId = new(StringComparer.Ordinal);
        HashSet<string> seenNormalizedArmIds = new(StringComparer.Ordinal);
        List<GraphNode> nodes = [];

        foreach (AzureInventoryResourceRecord resource in snapshot.Resources
                     .OrderBy(candidate => candidate.AzureResourceId, StringComparer.Ordinal))
        {
            string normalizedArmId = ArmResourceIdNormalizer.Normalize(resource.AzureResourceId);

            if (normalizedArmId.Length == 0)
            {
                continue;
            }

            if (!seenNormalizedArmIds.Add(normalizedArmId))
            {
                if (nodeByNormalizedArmId.TryGetValue(normalizedArmId, out GraphNode? duplicateTarget))
                {
                    MergeDuplicateResourceRowScalars(resource, duplicateTarget);
                }

                continue;
            }

            string nodeId = ResolveNodeId(resource);
            nodeIdByArmId[normalizedArmId] = nodeId;
            string resourceType = (resource.ResourceType ?? string.Empty).Trim();

            GraphNode node = new()
            {
                NodeId = nodeId,
                NodeType = GraphNodeTypes.TopologyResource,
                Label = ResolveLabel(resource),
                Category = AzureInventoryTopologyCategory.Resolve(resourceType),
                SourceType = ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot,
                SourceId = normalizedArmId,
            };

            node.Properties[StructuredDiagramGraphPropertyKeys.ProvenanceKind] =
                StructuredDiagramGraphProvenanceKinds.ObservedFact;
            node.Properties["arm.id"] = normalizedArmId;
            // Product-shaped citation keys used by FindingEvidenceRefs / AS-018 bind matching.
            node.Properties["armResourceId"] = normalizedArmId;
            node.Properties["azureResourceId"] = normalizedArmId;
            node.Properties["arm.type"] = resourceType;
            node.Properties["inventory.snapshotId"] = snapshot.Header.SnapshotId.ToString("D");

            if (!string.IsNullOrWhiteSpace(resource.ResourceGroup))
            {
                node.Properties["arm.resourceGroup"] = resource.ResourceGroup.Trim();
            }

            if (!string.IsNullOrWhiteSpace(resource.SubscriptionId))
            {
                node.Properties["arm.subscriptionId"] = resource.SubscriptionId.Trim();
            }

            if (!string.IsNullOrWhiteSpace(resource.ParentResourceId))
            {
                node.Properties["arm.parentId"] = ArmResourceIdNormalizer.Normalize(resource.ParentResourceId);
            }

            if (resource.CloudResourceId.HasValue)
            {
                node.Properties["cloudResourceId"] = resource.CloudResourceId.Value.ToString("D");
            }

            nodes.Add(node);
            nodeByNormalizedArmId[normalizedArmId] = node;
        }

        List<GraphEdge> edges = [];
        HashSet<string> edgeKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourceRelationshipReadModel relationship in snapshot.Relationships
                     .OrderBy(candidate => candidate.FromAzureResourceId, StringComparer.Ordinal)
                     .ThenBy(candidate => candidate.ToAzureResourceId, StringComparer.Ordinal)
                     .ThenBy(candidate => candidate.RelationshipType, StringComparer.Ordinal))
        {
            string normalizedFromArmId = ArmResourceIdNormalizer.Normalize(relationship.FromAzureResourceId);
            string normalizedToArmId = ArmResourceIdNormalizer.Normalize(relationship.ToAzureResourceId);

            if (!nodeIdByArmId.TryGetValue(normalizedFromArmId, out string? fromNodeId)
                || !nodeIdByArmId.TryGetValue(normalizedToArmId, out string? toNodeId))
            {
                continue;
            }

            string relationshipType = (relationship.RelationshipType ?? string.Empty).Trim();

            if (relationshipType.Length == 0)
            {
                continue;
            }

            string edgeKey = $"{fromNodeId}|{toNodeId}|{relationshipType}";

            if (!edgeKeys.Add(edgeKey))
            {
                continue;
            }

            edges.Add(new GraphEdge
            {
                EdgeId = $"edge-{edgeKey}",
                FromNodeId = fromNodeId,
                ToNodeId = toNodeId,
                EdgeType = relationshipType,
                Label = relationshipType,
                Weight = 1.0,
                Properties =
                {
                    [StructuredDiagramGraphPropertyKeys.ProvenanceKind] = StructuredDiagramGraphProvenanceKinds.ObservedFact,
                },
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
        string armId = resource.AzureResourceId ?? string.Empty;
        string? armNameSegment = null;
        int lastSlash = armId.LastIndexOf('/');

        if (lastSlash >= 0 && lastSlash < armId.Length - 1)
        {
            string trimmedSegment = armId[(lastSlash + 1)..].Trim();

            if (trimmedSegment.Length > 0)
            {
                armNameSegment = trimmedSegment;
            }
        }

        if (InventoryDiagramArmSegmentResourceNames.TryResolveStoredName(
                armId,
                armNameSegment,
                null,
                out string? storedName))
        {
            return storedName!;
        }

        return InventoryDiagramArmSegmentResourceNames.ResourceNameNotStored;
    }

    private static void MergeDuplicateResourceRowScalars(
        AzureInventoryResourceRecord resource,
        GraphNode node)
    {
        TryMergeTrimmedScalarProperty(
            node,
            "arm.resourceGroup",
            resource.ResourceGroup,
            "arm.resourceGroup");
        TryMergeTrimmedScalarProperty(
            node,
            "arm.subscriptionId",
            resource.SubscriptionId,
            "arm.subscriptionId");
        TryMergeResourceTypeFromDuplicateRow(resource, node);
        TryMergeLabelFromDuplicateRow(resource, node);
        TryMergeParentResourceIdFromDuplicateRow(resource, node);
        TryMergeCloudResourceIdFromDuplicateRow(resource, node);
    }

    private static void TryMergeTrimmedScalarProperty(
        GraphNode node,
        string propertyKey,
        string? incomingRaw,
        string disagreementLabel)
    {
        if (string.IsNullOrWhiteSpace(incomingRaw))
        {
            return;
        }

        string incoming = incomingRaw.Trim();

        if (node.Properties.TryGetValue(propertyKey, out string? existing))
        {
            if (!string.Equals(existing, incoming, StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException(
                    $"Inventory overlay duplicate resource rows disagree on {disagreementLabel} for the same normalized ARM resource id.");
            }

            return;
        }

        node.Properties[propertyKey] = incoming;
    }

    private static void TryMergeResourceTypeFromDuplicateRow(
        AzureInventoryResourceRecord resource,
        GraphNode node)
    {
        string incomingResourceType = (resource.ResourceType ?? string.Empty).Trim();

        if (incomingResourceType.Length == 0)
        {
            return;
        }

        if (node.Properties.TryGetValue("arm.type", out string? existingResourceType))
        {
            string existingTrimmed = existingResourceType.Trim();

            if (existingTrimmed.Length == 0)
            {
                node.Properties["arm.type"] = incomingResourceType;
                node.Category = AzureInventoryTopologyCategory.Resolve(incomingResourceType);
                return;
            }

            if (!string.Equals(existingTrimmed, incomingResourceType, StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException(
                    "Inventory overlay duplicate resource rows disagree on arm.type for the same normalized ARM resource id.");
            }

            return;
        }

        node.Properties["arm.type"] = incomingResourceType;
        node.Category = AzureInventoryTopologyCategory.Resolve(incomingResourceType);
    }

    private static void TryMergeLabelFromDuplicateRow(
        AzureInventoryResourceRecord resource,
        GraphNode node)
    {
        string incomingLabel = ResolveLabel(resource);

        if (incomingLabel.Length == 0)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(node.Label))
        {
            node.Label = incomingLabel;
            return;
        }

        if (!string.Equals(node.Label, incomingLabel, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "Inventory overlay duplicate resource rows disagree on Label for the same normalized ARM resource id.");
        }
    }

    private static void TryMergeParentResourceIdFromDuplicateRow(
        AzureInventoryResourceRecord resource,
        GraphNode node)
    {
        if (string.IsNullOrWhiteSpace(resource.ParentResourceId))
        {
            return;
        }

        string incomingParentId = ArmResourceIdNormalizer.Normalize(resource.ParentResourceId);

        if (node.Properties.TryGetValue("arm.parentId", out string? existingParentId))
        {
            if (!string.Equals(existingParentId, incomingParentId, StringComparison.Ordinal))
            {
                throw new ArgumentException(
                    "Inventory overlay duplicate resource rows disagree on arm.parentId for the same normalized ARM resource id.");
            }

            return;
        }

        node.Properties["arm.parentId"] = incomingParentId;
    }

    private static void TryMergeCloudResourceIdFromDuplicateRow(
        AzureInventoryResourceRecord resource,
        GraphNode node)
    {
        if (!resource.CloudResourceId.HasValue)
        {
            return;
        }

        string incomingCloudResourceId = resource.CloudResourceId.Value.ToString("D");

        if (Guid.TryParse(node.NodeId, out Guid nodeCloudResourceId)
            && nodeCloudResourceId != resource.CloudResourceId.Value)
        {
            throw new ArgumentException(
                "Inventory overlay duplicate resource rows disagree on cloudResourceId for the same normalized ARM resource id.");
        }

        if (node.Properties.TryGetValue("cloudResourceId", out string? existingCloudResourceId))
        {
            if (!string.Equals(existingCloudResourceId, incomingCloudResourceId, StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException(
                    "Inventory overlay duplicate resource rows disagree on cloudResourceId for the same normalized ARM resource id.");
            }

            return;
        }

        node.Properties["cloudResourceId"] = incomingCloudResourceId;
    }

}
