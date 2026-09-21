using System.Text.Json;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Restores NIC / private-endpoint / App Service → subnet hops from flattened snapshot
///     properties when association rows were missing or pointed at a nested ARM child that
///     was never captured as its own resource.
/// </summary>
internal static class AzureInventorySnapshotSubnetPlacementEdgeHydrator
{
    public static void AddMissingPlacementEdges(
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
            string fromArmId = ArmResourceIdNormalizer.Normalize(resource.AzureResourceId ?? string.Empty);

            if (string.IsNullOrWhiteSpace(fromArmId)
                || !AzureInventoryArmEndpointNodeResolver.TryResolveExactOrAncestorNodeId(
                    nodeIdByArmId,
                    fromArmId,
                    out string fromNodeId))
            {
                continue;
            }

            if (!propertiesByRowId.TryGetValue(
                    resource.ResourceRowId,
                    out List<AzureInventoryResourcePropertyReadModel>? properties))
            {
                continue;
            }

            foreach (PlacementHop hop in EnumeratePlacementHops(resource, properties))
            {
                if (string.IsNullOrWhiteSpace(hop.ToArmId))
                {
                    continue;
                }

                foreach (string toNodeId in AzureInventoryArmEndpointNodeResolver.ResolveRelatedNodeIds(
                             nodeIdByArmId,
                             hop.ToArmId))
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
                        hop.EdgeType,
                        hop.InferenceSource);
                }
            }
        }
    }

    private static IEnumerable<PlacementHop> EnumeratePlacementHops(
        AzureInventoryResourceRecord resource,
        IReadOnlyList<AzureInventoryResourcePropertyReadModel> properties)
    {
        string resourceType = resource.ResourceType ?? string.Empty;

        foreach (AzureInventoryResourcePropertyReadModel property in properties)
        {
            if (string.IsNullOrWhiteSpace(property.PropertyKey)
                || string.IsNullOrWhiteSpace(property.PropertyValue))
            {
                continue;
            }

            if (IsNicSubnetProperty(resourceType, property.PropertyKey))
            {
                yield return CreateHop(
                    property.PropertyValue,
                    AzureInventoryRelationshipAssociationTypes.NicToSubnet,
                    GraphEdgeInferenceSources.InventoryNicSubnet);
            }

            if (IsPrivateEndpointSubnetProperty(resourceType, property.PropertyKey))
            {
                yield return CreateHop(
                    property.PropertyValue,
                    AzureInventoryRelationshipAssociationTypes.PeToSubnet,
                    GraphEdgeInferenceSources.InventoryPeSubnet);
            }

            if (IsAppServiceSubnetProperty(property.PropertyKey))
            {
                yield return CreateHop(
                    property.PropertyValue,
                    AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet,
                    GraphEdgeInferenceSources.InventoryAppServiceSubnet);
            }

            if (IsVirtualNetworkSubnetsJson(resourceType, property.PropertyKey))
            {
                foreach (PlacementHop nestedHop in EnumerateVirtualNetworkSubnetControlHops(property.PropertyValue))
                {
                    yield return nestedHop;
                }
            }
        }
    }

    private static IEnumerable<PlacementHop> EnumerateVirtualNetworkSubnetControlHops(string subnetsJson)
    {
        List<PlacementHop> hops = [];

        try
        {
            using JsonDocument document = JsonDocument.Parse(subnetsJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return hops;
            }

            foreach (JsonElement subnet in document.RootElement.EnumerateArray())
            {
                string? nsgId = TryReadNestedResourceId(subnet, "networkSecurityGroup", "id");

                if (!string.IsNullOrWhiteSpace(nsgId))
                {
                    hops.Add(CreateHop(
                        nsgId,
                        GraphEdgeTypes.AppliesTo,
                        GraphEdgeInferenceSources.InventorySubnetNsg));
                }

                string? routeTableId = TryReadNestedResourceId(subnet, "routeTable", "id");

                if (!string.IsNullOrWhiteSpace(routeTableId))
                {
                    hops.Add(CreateHop(
                        routeTableId,
                        GraphEdgeTypes.AppliesTo,
                        GraphEdgeInferenceSources.InventorySubnetRouteTable));
                }
            }
        }
        catch (JsonException)
        {
            return hops;
        }

        return hops;
    }

    private static PlacementHop CreateHop(string toArmId, string edgeType, string inferenceSource)
    {
        return new PlacementHop(
            ArmResourceIdNormalizer.Normalize(toArmId),
            edgeType,
            inferenceSource);
    }

    private static bool IsNicSubnetProperty(string resourceType, string propertyKey)
    {
        if (!resourceType.Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return propertyKey.StartsWith("ipConfiguration.subnet.id", StringComparison.OrdinalIgnoreCase)
            || propertyKey.Equals("subnetId", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPrivateEndpointSubnetProperty(string resourceType, string propertyKey)
    {
        if (!resourceType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return propertyKey.Equals("subnet.id", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAppServiceSubnetProperty(string propertyKey)
    {
        return propertyKey.Equals("virtualNetworkSubnetId", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsVirtualNetworkSubnetsJson(string resourceType, string propertyKey)
    {
        if (!AzureInventoryTopologyCategory.IsVirtualNetworkArmType(resourceType))
        {
            return false;
        }

        return propertyKey.Equals("subnets", StringComparison.OrdinalIgnoreCase);
    }

    private static string? TryReadNestedResourceId(JsonElement parent, string objectName, string idProperty)
    {
        if (parent.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        JsonElement container = parent;

        if (parent.TryGetProperty("properties", out JsonElement properties)
            && properties.ValueKind is JsonValueKind.Object)
        {
            container = properties;
        }

        if (!container.TryGetProperty(objectName, out JsonElement nested)
            || nested.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        if (!nested.TryGetProperty(idProperty, out JsonElement idElement)
            || idElement.ValueKind is not JsonValueKind.String)
        {
            return null;
        }

        string? id = idElement.GetString();

        return string.IsNullOrWhiteSpace(id) ? null : id;
    }

    private static void TryAddEdge(
        List<GraphEdge> edges,
        HashSet<string> edgeKeys,
        string fromNodeId,
        string toNodeId,
        string edgeType,
        string inferenceSource)
    {
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
            InferenceSource = inferenceSource,
            ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
        });
    }

    private sealed record PlacementHop(string ToArmId, string EdgeType, string InferenceSource);
}
