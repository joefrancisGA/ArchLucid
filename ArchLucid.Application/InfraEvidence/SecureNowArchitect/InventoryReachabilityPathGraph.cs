using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class InventoryReachabilityPathGraph
{
    private static readonly HashSet<string> TraversableEdgeTypes =
    [
        GraphEdgeTypes.Exposes,
        GraphEdgeTypes.RoutesTo,
        GraphEdgeTypes.ConnectsTo,
        GraphEdgeTypes.DependsOn,
        GraphEdgeTypes.Contains,
    ];

    public static InventoryReachabilityPathGraphSnapshot Build(AzureInventorySnapshotDetailReadModel snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        Dictionary<string, List<PrivilegePathEdge>> outgoing = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, AzureInventoryResourceRecord> resourcesByArmId =
            snapshot.Resources.ToDictionary(static resource => resource.AzureResourceId, StringComparer.OrdinalIgnoreCase);

        Dictionary<Guid, List<AzureInventoryTagReadModel>> tagsByResourceRowId =
            snapshot.Tags
                .GroupBy(static tag => tag.ResourceRowId)
                .ToDictionary(static group => group.Key, static group => group.ToList());

        Dictionary<Guid, List<AzureInventoryResourcePropertyReadModel>> propertiesByResourceRowId =
            snapshot.Properties
                .GroupBy(static property => property.ResourceRowId)
                .ToDictionary(static group => group.Key, static group => group.ToList());

        HashSet<string> subnetsWithNsgAllowRule = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> publicIpArmIds = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> publicNetworkAccessArmIds = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> privateEndpointOnlyArmIds = new(StringComparer.OrdinalIgnoreCase);

        AzureInventoryPrivateEndpointDnsJoinIndex dnsJoinIndex =
            AzureInventoryPrivateEndpointDnsJoinIndex.Build(
                snapshot.Relationships.Select(static relationship =>
                    new AzureInventoryRelationshipArmTriple(
                        relationship.FromAzureResourceId,
                        relationship.ToAzureResourceId,
                        relationship.InferenceSource)));

        foreach (AzureInventoryResourceRecord resource in resourcesByArmId.Values)
        {
            if (resource.ResourceType.Contains("publicIPAddresses", StringComparison.OrdinalIgnoreCase))
            {
                publicIpArmIds.Add(resource.AzureResourceId);
            }

            Dictionary<string, string> propertyBag = BuildPropertyBag(
                resource.ResourceRowId,
                propertiesByResourceRowId);

            if (propertyBag.Count == 0)
            {
                continue;
            }

            if (AzureInventoryPublicNetworkAccessResolver.IsPublicNetworkAccessEnabled(propertyBag))
            {
                publicNetworkAccessArmIds.Add(resource.AzureResourceId);
            }

            if (AzureInventoryPublicNetworkAccessResolver.IsPrivateEndpointOnlyExposure(propertyBag))
            {
                privateEndpointOnlyArmIds.Add(resource.AzureResourceId);
            }
        }

        foreach (AzureInventoryResourceRelationshipReadModel relationship in snapshot.Relationships)
        {
            if (!TraversableEdgeTypes.Contains(relationship.RelationshipType))
            {
                continue;
            }

            if (relationship.RelationshipType == GraphEdgeTypes.RoutesTo)
            {
                subnetsWithNsgAllowRule.Add(relationship.FromAzureResourceId);
            }

            AddEdge(
                outgoing,
                new PrivilegePathEdge
                {
                    FromNodeId = relationship.FromAzureResourceId,
                    ToNodeId = relationship.ToAzureResourceId,
                    EdgeType = relationship.RelationshipType,
                    ProvenanceKind = relationship.ProvenanceKind,
                    InferenceSource = relationship.InferenceSource,
                    RoleName = null,
                });
        }

        foreach (string resourceArmId in publicNetworkAccessArmIds)
        {
            AddEdge(
                outgoing,
                new PrivilegePathEdge
                {
                    FromNodeId = SecureNowArchitectConstants.InternetPublicExposureNodeId,
                    ToNodeId = resourceArmId,
                    EdgeType = SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                    RoleName = null,
                });
        }

        return new InventoryReachabilityPathGraphSnapshot
        {
            OutgoingEdges = outgoing,
            ResourcesByArmId = resourcesByArmId,
            TagsByResourceRowId = tagsByResourceRowId,
            SubnetsWithNsgAllowRule = subnetsWithNsgAllowRule,
            PublicIpArmIds = publicIpArmIds,
            PublicNetworkAccessArmIds = publicNetworkAccessArmIds,
            PrivateEndpointOnlyArmIds = privateEndpointOnlyArmIds,
            PrivateIntegratedComputeArmIds = dnsJoinIndex.ComputeToVnetArmId.Keys.ToHashSet(StringComparer.OrdinalIgnoreCase),
            DnsJoinIndex = dnsJoinIndex,
        };
    }

    public static bool IsPeReachablePrivateHop(PrivilegePathEdge hop) =>
        string.Equals(
            hop.InferenceSource,
            GraphEdgeInferenceSources.InventoryPeReachableTarget,
            StringComparison.OrdinalIgnoreCase);

    public static bool IsReachabilityAsset(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return false;
        }

        return resourceType.Contains("storageAccounts", StringComparison.OrdinalIgnoreCase)
               || resourceType.Contains("servers", StringComparison.OrdinalIgnoreCase)
               || resourceType.Contains("vaults", StringComparison.OrdinalIgnoreCase)
               || resourceType.Contains("sites", StringComparison.OrdinalIgnoreCase)
               || resourceType.Contains("managedClusters", StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsSubnetNode(string nodeId) =>
        nodeId.Contains("/subnets/", StringComparison.OrdinalIgnoreCase);

    private static Dictionary<string, string> BuildPropertyBag(
        Guid resourceRowId,
        IReadOnlyDictionary<Guid, List<AzureInventoryResourcePropertyReadModel>> propertiesByResourceRowId)
    {
        Dictionary<string, string> propertyBag = new(StringComparer.OrdinalIgnoreCase);

        if (!propertiesByResourceRowId.TryGetValue(resourceRowId, out List<AzureInventoryResourcePropertyReadModel>? properties))
        {
            return propertyBag;
        }

        foreach (AzureInventoryResourcePropertyReadModel property in properties)
        {
            if (string.IsNullOrWhiteSpace(property.PropertyKey))
            {
                continue;
            }

            propertyBag[property.PropertyKey] = property.PropertyValue ?? string.Empty;
        }

        return propertyBag;
    }

    private static void AddEdge(
        Dictionary<string, List<PrivilegePathEdge>> outgoing,
        PrivilegePathEdge edge)
    {
        if (!outgoing.TryGetValue(edge.FromNodeId, out List<PrivilegePathEdge>? edges))
        {
            edges = [];
            outgoing[edge.FromNodeId] = edges;
        }

        edges.Add(edge);
    }
}

internal sealed class InventoryReachabilityPathGraphSnapshot
{
    public IReadOnlyDictionary<string, List<PrivilegePathEdge>> OutgoingEdges
    {
        get;
        init;
    } = new Dictionary<string, List<PrivilegePathEdge>>();

    public IReadOnlyDictionary<string, AzureInventoryResourceRecord> ResourcesByArmId
    {
        get;
        init;
    } = new Dictionary<string, AzureInventoryResourceRecord>();

    public IReadOnlyDictionary<Guid, List<AzureInventoryTagReadModel>> TagsByResourceRowId
    {
        get;
        init;
    } = new Dictionary<Guid, List<AzureInventoryTagReadModel>>();

    public IReadOnlySet<string> SubnetsWithNsgAllowRule
    {
        get;
        init;
    } = new HashSet<string>();

    public IReadOnlySet<string> PublicIpArmIds
    {
        get;
        init;
    } = new HashSet<string>();

    public IReadOnlySet<string> PublicNetworkAccessArmIds
    {
        get;
        init;
    } = new HashSet<string>();

    public IReadOnlySet<string> PrivateEndpointOnlyArmIds
    {
        get;
        init;
    } = new HashSet<string>();

    public IReadOnlySet<string> PrivateIntegratedComputeArmIds
    {
        get;
        init;
    } = new HashSet<string>();

    public AzureInventoryPrivateEndpointDnsJoinIndex? DnsJoinIndex
    {
        get;
        init;
    }
}
