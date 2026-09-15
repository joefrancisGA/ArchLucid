using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Restores VNet peering edges for snapshots that stored peering JSON or child rows
///     but never materialized <c>PEERS_WITH</c> relationships.
/// </summary>
internal static class AzureInventorySnapshotVnetPeeringEdgeHydrator
{
    public static void AddMissingPeeringEdges(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyDictionary<string, string> nodeIdByArmId,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(nodeIdByArmId);
        ArgumentNullException.ThrowIfNull(edges);
        ArgumentNullException.ThrowIfNull(edgeKeys);

        HashSet<string> peeringPairKeys = BuildExistingPeeringPairKeys(edges);
        Dictionary<Guid, List<AzureInventoryResourcePropertyReadModel>> propertiesByRowId =
            snapshot.Properties
                .GroupBy(property => property.ResourceRowId)
                .ToDictionary(group => group.Key, group => group.ToList());

        foreach (AzureInventoryResourceRecord resource in snapshot.Resources)
        {
            if (AzureInventoryVnetPeeringParser.IsPeeringResourceType(resource.ResourceType)
                || AzureInventoryVnetPeeringParser.IsPeeringResourceId(resource.AzureResourceId))
            {
                TryAddChildPeeringEdge(
                    resource,
                    propertiesByRowId,
                    nodeIdByArmId,
                    edges,
                    edgeKeys,
                    peeringPairKeys);
                continue;
            }

            if (!AzureInventoryVnetPeeringParser.IsVirtualNetworkResourceType(resource.ResourceType))
            {
                continue;
            }

            TryAddNestedPeeringEdges(
                resource,
                propertiesByRowId,
                nodeIdByArmId,
                edges,
                edgeKeys,
                peeringPairKeys);
        }
    }

    private static void TryAddNestedPeeringEdges(
        AzureInventoryResourceRecord resource,
        IReadOnlyDictionary<Guid, List<AzureInventoryResourcePropertyReadModel>> propertiesByRowId,
        IReadOnlyDictionary<string, string> nodeIdByArmId,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys,
        HashSet<string> peeringPairKeys)
    {
        if (!propertiesByRowId.TryGetValue(
                resource.ResourceRowId,
                out List<AzureInventoryResourcePropertyReadModel>? properties))
        {
            return;
        }

        AzureInventoryResourcePropertyReadModel? peeringsProperty = properties.FirstOrDefault(property =>
            string.Equals(
                property.PropertyKey,
                AzureInventoryVnetPeeringParser.PeeringsPropertyKey,
                StringComparison.OrdinalIgnoreCase));

        if (peeringsProperty is null || string.IsNullOrWhiteSpace(peeringsProperty.PropertyValue))
        {
            return;
        }

        foreach (string remoteVnetId in AzureInventoryVnetPeeringParser.EnumerateRemoteVnetIds(
                     peeringsProperty.PropertyValue))
        {
            TryAddPeeringEdge(
                resource.AzureResourceId,
                remoteVnetId,
                nodeIdByArmId,
                edges,
                edgeKeys,
                peeringPairKeys);
        }
    }

    private static void TryAddChildPeeringEdge(
        AzureInventoryResourceRecord resource,
        IReadOnlyDictionary<Guid, List<AzureInventoryResourcePropertyReadModel>> propertiesByRowId,
        IReadOnlyDictionary<string, string> nodeIdByArmId,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys,
        HashSet<string> peeringPairKeys)
    {
        string? localVnetId = AzureInventoryVnetPeeringParser.TryGetParentVirtualNetworkArmId(resource.AzureResourceId);

        if (string.IsNullOrWhiteSpace(localVnetId))
        {
            return;
        }

        Dictionary<string, string?> propertyValues = new(StringComparer.OrdinalIgnoreCase);

        if (propertiesByRowId.TryGetValue(
                resource.ResourceRowId,
                out List<AzureInventoryResourcePropertyReadModel>? properties))
        {
            foreach (AzureInventoryResourcePropertyReadModel property in properties)
            {
                propertyValues[property.PropertyKey] = property.PropertyValue;
            }
        }

        string? remoteVnetId = AzureInventoryVnetPeeringParser.TryReadRemoteVnetIdFromProperties(propertyValues);

        if (string.IsNullOrWhiteSpace(remoteVnetId))
        {
            return;
        }

        TryAddPeeringEdge(
            localVnetId,
            remoteVnetId,
            nodeIdByArmId,
            edges,
            edgeKeys,
            peeringPairKeys);
    }

    private static void TryAddPeeringEdge(
        string? fromAzureResourceId,
        string? toAzureResourceId,
        IReadOnlyDictionary<string, string> nodeIdByArmId,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys,
        HashSet<string> peeringPairKeys)
    {
        string fromArmId = ArmResourceIdNormalizer.Normalize(fromAzureResourceId);
        string toArmId = ArmResourceIdNormalizer.Normalize(toAzureResourceId);

        if (string.IsNullOrWhiteSpace(fromArmId)
            || string.IsNullOrWhiteSpace(toArmId)
            || string.Equals(fromArmId, toArmId, StringComparison.Ordinal))
        {
            return;
        }

        if (!nodeIdByArmId.TryGetValue(fromArmId, out string? fromNodeId)
            || !nodeIdByArmId.TryGetValue(toArmId, out string? toNodeId))
        {
            return;
        }

        string pairKey = CanonicalPeeringPairKey(fromNodeId, toNodeId);

        if (!peeringPairKeys.Add(pairKey))
        {
            return;
        }

        string edgeType = GraphEdgeTypes.PeersWith;
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
            InferenceSource = GraphEdgeInferenceSources.InventoryVnetPeering,
        });
    }

    private static HashSet<string> BuildExistingPeeringPairKeys(IReadOnlyList<GraphEdge> edges)
    {
        HashSet<string> pairKeys = new(StringComparer.Ordinal);

        foreach (GraphEdge edge in edges)
        {
            if (!string.Equals(edge.EdgeType, GraphEdgeTypes.PeersWith, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            pairKeys.Add(CanonicalPeeringPairKey(edge.FromNodeId, edge.ToNodeId));
        }

        return pairKeys;
    }

    private static string CanonicalPeeringPairKey(string fromNodeId, string toNodeId)
    {
        if (string.CompareOrdinal(fromNodeId, toNodeId) <= 0)
        {
            return $"{fromNodeId}|{toNodeId}";
        }

        return $"{toNodeId}|{fromNodeId}";
    }
}
