using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Restores private-endpoint → PaaS edges from flattened <c>privateLinkServiceId</c> properties
///     when network-association rows were missing or pointed at a parent ARM id.
/// </summary>
internal static class AzureInventorySnapshotPrivateEndpointEdgeHydrator
{
    public static void AddMissingTargetEdges(
        AzureInventorySnapshotDetailReadModel snapshot,
        Dictionary<string, string> nodeIdByArmId,
        List<GraphNode> nodes,
        HashSet<string> seenNodeIds,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys,
        IReadOnlySet<string> collectedArmIds,
        IReadOnlySet<string> hiddenArmIds,
        bool includeNeverShowArmTypes,
        bool retainIdentityDiagramArmTypes)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(nodeIdByArmId);
        ArgumentNullException.ThrowIfNull(edges);
        ArgumentNullException.ThrowIfNull(edgeKeys);

        Dictionary<Guid, List<AzureInventoryResourcePropertyReadModel>> propertiesByRowId =
            snapshot.Properties
                .GroupBy(property => property.ResourceRowId)
                .ToDictionary(group => group.Key, group => group.ToList());

        foreach (AzureInventoryResourceRecord resource in snapshot.Resources)
        {
            if (!IsPrivateEndpointResource(resource))
            {
                continue;
            }

            string fromArmId = ArmResourceIdNormalizer.Normalize(resource.AzureResourceId ?? string.Empty);

            if (string.IsNullOrWhiteSpace(fromArmId)
                || !nodeIdByArmId.TryGetValue(fromArmId, out string? fromNodeId))
            {
                continue;
            }

            if (!propertiesByRowId.TryGetValue(resource.ResourceRowId, out List<AzureInventoryResourcePropertyReadModel>? properties))
            {
                continue;
            }

            foreach (AzureInventoryResourcePropertyReadModel property in properties
                         .Where(property => !property.IsRedacted && IsPrivateLinkPropertyKey(property.PropertyKey))
                         .OrderBy(property => property.PropertyKey, StringComparer.Ordinal))
            {
                string targetArmId = ArmResourceIdNormalizer.Normalize(property.PropertyValue);
                foreach (string toNodeId in AzureInventoryReferencedEndpointNodeFactory.ResolveVisibleTargetNodeIds(
                             targetArmId,
                             nodeIdByArmId,
                             nodes,
                             seenNodeIds,
                             collectedArmIds,
                             hiddenArmIds,
                             includeNeverShowArmTypes,
                             retainIdentityDiagramArmTypes))
                {
                    if (string.Equals(fromNodeId, toNodeId, StringComparison.Ordinal))
                    {
                        continue;
                    }

                    TryAddEdge(
                        edges,
                        edgeKeys,
                        fromNodeId,
                        toNodeId,
                        AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget,
                        GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                        resource,
                        property.PropertyKey,
                        targetArmId);
                }
            }
        }
    }

    internal static bool IsPrivateEndpointResource(AzureInventoryResourceRecord resource)
    {
        string resourceType = resource.ResourceType ?? string.Empty;
        string azureResourceId = resource.AzureResourceId ?? string.Empty;

        return resourceType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase)
            || azureResourceId.Contains("/privateEndpoints/", StringComparison.OrdinalIgnoreCase);
    }

    internal static bool IsPrivateLinkPropertyKey(string? key)
    {
        const string prefix = "privateLinkServiceId";
        if (string.Equals(key, prefix, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return key is not null
            && key.StartsWith(prefix + "[", StringComparison.OrdinalIgnoreCase)
            && key.EndsWith(']')
            && key.Length > prefix.Length + 2
            && key.AsSpan(prefix.Length + 1, key.Length - prefix.Length - 2).IndexOfAnyExceptInRange('0', '9') < 0;
    }

    private static void TryAddEdge(
        List<GraphEdge> edges,
        HashSet<string> edgeKeys,
        string fromNodeId,
        string toNodeId,
        string edgeType,
        string inferenceSource,
        AzureInventoryResourceRecord owner,
        string propertyKey,
        string targetArmId)
    {
        GraphEdge? edge = edges.FirstOrDefault(candidate => candidate.FromNodeId == fromNodeId
            && candidate.ToNodeId == toNodeId && candidate.EdgeType == edgeType);
        edge ??= AzureInventorySnapshotGraphEdgeAppender.TryAdd(
            edges, edgeKeys, fromNodeId, toNodeId, edgeType, inferenceSource,
            provenanceKind: ProvenanceKind.DeterministicInference.ToString(),
            promoteStrongerProvenance: false);

        if (edge is not null)
        {
            edge.Properties.TryAdd("evidence.propertyKey", propertyKey);
            edge.Properties.TryAdd("evidence.resourceRowId", owner.ResourceRowId.ToString("D"));
            edge.Properties.TryAdd("evidence.targetArmId", targetArmId);
            if (!string.IsNullOrWhiteSpace(owner.SourceEvidenceReference))
            {
                edge.Properties.TryAdd("evidence.sourceReference", owner.SourceEvidenceReference);
            }
        }
    }
}
