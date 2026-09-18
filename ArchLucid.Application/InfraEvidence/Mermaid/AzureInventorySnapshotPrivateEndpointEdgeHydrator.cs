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
        List<GraphEdge> edges,
        HashSet<string> edgeKeys)
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

            foreach (string targetArmId in EnumeratePrivateLinkServiceIds(properties))
            {
                foreach (string toNodeId in ResolveTargetNodeIds(nodeIdByArmId, targetArmId))
                {
                    TryAddEdge(edges, edgeKeys, fromNodeId, toNodeId);
                }
            }
        }
    }

    private static bool IsPrivateEndpointResource(AzureInventoryResourceRecord resource)
    {
        string resourceType = resource.ResourceType ?? string.Empty;
        string azureResourceId = resource.AzureResourceId ?? string.Empty;

        return resourceType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase)
            || azureResourceId.Contains("/privateEndpoints/", StringComparison.OrdinalIgnoreCase);
    }

    private static IEnumerable<string> EnumeratePrivateLinkServiceIds(
        IReadOnlyList<AzureInventoryResourcePropertyReadModel> properties)
    {
        HashSet<string> ids = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourcePropertyReadModel property in properties)
        {
            if (string.IsNullOrWhiteSpace(property.PropertyKey)
                || string.IsNullOrWhiteSpace(property.PropertyValue))
            {
                continue;
            }

            if (!property.PropertyKey.StartsWith("privateLinkServiceId", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string normalized = ArmResourceIdNormalizer.Normalize(property.PropertyValue);

            if (!string.IsNullOrWhiteSpace(normalized))
            {
                ids.Add(normalized);
            }
        }

        return ids;
    }

    private static IEnumerable<string> ResolveTargetNodeIds(
        Dictionary<string, string> nodeIdByArmId,
        string targetArmId)
    {
        HashSet<string> nodeIds = new(StringComparer.Ordinal);

        if (nodeIdByArmId.TryGetValue(targetArmId, out string? exactNodeId))
        {
            nodeIds.Add(exactNodeId);
        }

        string childPrefix = targetArmId.TrimEnd('/') + "/";

        foreach (KeyValuePair<string, string> pair in nodeIdByArmId)
        {
            if (pair.Key.StartsWith(childPrefix, StringComparison.OrdinalIgnoreCase))
            {
                nodeIds.Add(pair.Value);
            }
        }

        return nodeIds;
    }

    private static void TryAddEdge(
        List<GraphEdge> edges,
        HashSet<string> edgeKeys,
        string fromNodeId,
        string toNodeId)
    {
        string edgeType = AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget;
        string edgeKey = $"{fromNodeId}|{toNodeId}|{edgeType}";

        if (!edgeKeys.Add(edgeKey))
        {
            return;
        }

        edges.Add(new GraphEdge
        {
            EdgeId = $"edge-{edgeKey}",
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = edgeType,
            Label = edgeType,
            Weight = 1.0d,
            InferenceSource = GraphEdgeInferenceSources.InventoryPrivateEndpoint,
        });
    }
}
