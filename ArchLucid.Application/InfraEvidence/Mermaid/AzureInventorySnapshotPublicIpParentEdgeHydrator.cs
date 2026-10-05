using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>Restores observed public-IP exposure edges from flattened inventory properties.</summary>
internal static class AzureInventorySnapshotPublicIpParentEdgeHydrator
{
    public static void AddMissingParentEdges(
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
            if (!resource.ResourceType.Contains("publicIPAddresses", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string publicIpArmId = ArmResourceIdNormalizer.Normalize(resource.AzureResourceId);

            if (!nodeIdByArmId.TryGetValue(publicIpArmId, out string? publicIpNodeId)
                || !propertiesByRowId.TryGetValue(resource.ResourceRowId, out List<AzureInventoryResourcePropertyReadModel>? properties))
            {
                continue;
            }

            foreach (string parentArmId in ResolveParentArmIds(properties))
            {
                foreach (string parentNodeId in AzureInventoryArmEndpointNodeResolver.ResolveRelatedNodeIds(
                             nodeIdByArmId,
                             parentArmId))
                {
                    if (string.Equals(publicIpNodeId, parentNodeId, StringComparison.Ordinal))
                    {
                        continue;
                    }

                    TryAddEdge(edges, edgeKeys, publicIpNodeId, parentNodeId);
                }
            }
        }
    }

    private static IReadOnlyList<string> ResolveParentArmIds(
        IReadOnlyList<AzureInventoryResourcePropertyReadModel> properties)
    {
        HashSet<string> parentArmIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourcePropertyReadModel property in properties)
        {
            if (property.IsRedacted || string.IsNullOrWhiteSpace(property.PropertyValue))
            {
                continue;
            }

            if (property.PropertyKey.Equals("ipConfiguration.id", StringComparison.OrdinalIgnoreCase))
            {
                string? parentArmId =
                    AzureInventoryPublicIpConfigurationParentResolver.TryResolveParentArmId(property.PropertyValue);

                if (!string.IsNullOrWhiteSpace(parentArmId))
                {
                    parentArmIds.Add(ArmResourceIdNormalizer.Normalize(parentArmId));
                }
            }
            else if (property.PropertyKey.Equals("natGateway.id", StringComparison.OrdinalIgnoreCase))
            {
                parentArmIds.Add(ArmResourceIdNormalizer.Normalize(property.PropertyValue));
            }
        }

        return parentArmIds
            .Where(parentArmId => !string.IsNullOrWhiteSpace(parentArmId))
            .OrderBy(parentArmId => parentArmId, StringComparer.Ordinal)
            .ToList();
    }

    private static void TryAddEdge(
        List<GraphEdge> edges,
        HashSet<string> edgeKeys,
        string fromNodeId,
        string toNodeId)
    {
        string edgeKey = $"{fromNodeId}|{toNodeId}|{GraphEdgeTypes.Exposes}";

        if (!edgeKeys.Add(edgeKey))
        {
            return;
        }

        edges.Add(new GraphEdge
        {
            EdgeId = $"edge-{edgeKey}",
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = GraphEdgeTypes.Exposes,
            Label = GraphEdgeTypes.Exposes,
            Weight = 1.0d,
            InferenceSource = GraphEdgeInferenceSources.InventoryPublicIp,
        });
    }
}
