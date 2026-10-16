using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Indexes subnet routes and declared edge appliances for SA-05 indeterminate hops (Ch. 7).
/// </summary>
public sealed class AzureInventoryReachabilityEdgeControlIndex
{
    private static class InferenceSources
    {
        public const string SubnetRouteTable = "inventory-subnet-route-table";
        public const string AgwBackend = "inventory-agw-backend";
        public const string FrontDoorOrigin = "inventory-front-door-origin";
    }

    private readonly HashSet<string> _subnetsWithUnmodeledEdgeRoute;
    private readonly HashSet<string> _assetsBehindApplicationGateway;
    private readonly HashSet<string> _assetsBehindFrontDoor;

    private AzureInventoryReachabilityEdgeControlIndex(
        HashSet<string> subnetsWithUnmodeledEdgeRoute,
        HashSet<string> assetsBehindApplicationGateway,
        HashSet<string> assetsBehindFrontDoor)
    {
        _subnetsWithUnmodeledEdgeRoute = subnetsWithUnmodeledEdgeRoute;
        _assetsBehindApplicationGateway = assetsBehindApplicationGateway;
        _assetsBehindFrontDoor = assetsBehindFrontDoor;
    }

    public bool SubnetRequiresEdgeControlEvidence(string subnetArmId) =>
        _subnetsWithUnmodeledEdgeRoute.Contains(ArmResourceIdNormalizer.Normalize(subnetArmId));

    public bool AssetDeclaredBehindApplicationGateway(string assetArmId) =>
        _assetsBehindApplicationGateway.Contains(ArmResourceIdNormalizer.Normalize(assetArmId))
        || _assetsBehindApplicationGateway.Any(backendArmId =>
            ArmResourceIdNormalizer.IsDescendantOf(assetArmId, backendArmId)
            || ArmResourceIdNormalizer.IsDescendantOf(backendArmId, assetArmId));

    public bool AssetDeclaredBehindFrontDoor(string assetArmId) =>
        _assetsBehindFrontDoor.Contains(ArmResourceIdNormalizer.Normalize(assetArmId))
        || _assetsBehindFrontDoor.Any(originArmId =>
            ArmResourceIdNormalizer.IsDescendantOf(assetArmId, originArmId)
            || ArmResourceIdNormalizer.IsDescendantOf(originArmId, assetArmId));

    public static AzureInventoryReachabilityEdgeControlIndex Build(
        IEnumerable<AzureInventoryRelationshipArmTriple> relationships,
        IReadOnlyDictionary<string, AzureInventoryReachabilityResourceProperties> resourcesByArmId)
    {
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(resourcesByArmId);

        IReadOnlyDictionary<string, AzureInventoryReachabilityResourceProperties> normalizedResourcesByArmId =
            NormalizeReachabilityResourceIndex(resourcesByArmId);

        Dictionary<string, string> subnetToRouteTable = BuildSubnetToRouteTableMap(relationships);
        HashSet<string> subnetsWithUnmodeledEdgeRoute = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> assetsBehindApplicationGateway = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> assetsBehindFrontDoor = new(StringComparer.OrdinalIgnoreCase);

        foreach ((string subnetArmId, string routeTableArmId) in subnetToRouteTable)
        {
            if (!normalizedResourcesByArmId.TryGetValue(routeTableArmId, out AzureInventoryReachabilityResourceProperties? routeTable))
            {
                continue;
            }

            if (RouteTableRequiresUnmodeledEdgeControl(routeTable.Properties, normalizedResourcesByArmId))
            {
                subnetsWithUnmodeledEdgeRoute.Add(subnetArmId);
            }
        }

        foreach (AzureInventoryRelationshipArmTriple relationship in relationships)
        {
            if (string.Equals(relationship.InferenceSource, InferenceSources.AgwBackend, StringComparison.OrdinalIgnoreCase))
            {
                assetsBehindApplicationGateway.Add(
                    ArmResourceIdNormalizer.Normalize(relationship.ToAzureResourceId));
            }

            if (string.Equals(relationship.InferenceSource, InferenceSources.FrontDoorOrigin, StringComparison.OrdinalIgnoreCase))
            {
                assetsBehindFrontDoor.Add(
                    ArmResourceIdNormalizer.Normalize(relationship.ToAzureResourceId));
            }
        }

        return new AzureInventoryReachabilityEdgeControlIndex(
            subnetsWithUnmodeledEdgeRoute,
            assetsBehindApplicationGateway,
            assetsBehindFrontDoor);
    }

    private static bool RouteTableRequiresUnmodeledEdgeControl(
        IReadOnlyDictionary<string, string> routeTableProperties,
        IReadOnlyDictionary<string, AzureInventoryReachabilityResourceProperties> resourcesByArmId)
    {
        foreach (AzureInventoryRouteTableRoute route in AzureInventoryRouteTableRouteParser.Parse(routeTableProperties))
        {
            if (string.IsNullOrWhiteSpace(route.NextHopType))
            {
                continue;
            }

            if (route.NextHopType.Equals("VirtualNetworkGateway", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (!route.NextHopType.Equals("VirtualAppliance", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(route.NextHopArmId))
            {
                return true;
            }

            string normalizedNextHop = ArmResourceIdNormalizer.Normalize(route.NextHopArmId);

            if (!resourcesByArmId.ContainsKey(normalizedNextHop))
            {
                return true;
            }

            if (!resourcesByArmId.TryGetValue(normalizedNextHop, out AzureInventoryReachabilityResourceProperties? nextHopResource))
            {
                return true;
            }

            // Firewall present in snapshot; application rules are still out of scope for SA-05.
            if (nextHopResource.ResourceType.Contains("azureFirewalls", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static Dictionary<string, AzureInventoryReachabilityResourceProperties> NormalizeReachabilityResourceIndex(
        IReadOnlyDictionary<string, AzureInventoryReachabilityResourceProperties> resourcesByArmId)
    {
        Dictionary<string, AzureInventoryReachabilityResourceProperties> normalized =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (KeyValuePair<string, AzureInventoryReachabilityResourceProperties> entry in resourcesByArmId)
        {
            normalized[ArmResourceIdNormalizer.Normalize(entry.Key)] = entry.Value;
        }

        return normalized;
    }

    private static Dictionary<string, string> BuildSubnetToRouteTableMap(
        IEnumerable<AzureInventoryRelationshipArmTriple> relationships)
    {
        Dictionary<string, string> map = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryRelationshipArmTriple relationship in relationships)
        {
            if (!string.Equals(relationship.InferenceSource, InferenceSources.SubnetRouteTable, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            map[ArmResourceIdNormalizer.Normalize(relationship.FromAzureResourceId)] =
                ArmResourceIdNormalizer.Normalize(relationship.ToAzureResourceId);
        }

        return map;
    }
}

public sealed class AzureInventoryReachabilityResourceProperties
{
    public string ResourceType
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyDictionary<string, string> Properties
    {
        get;
        init;
    } = new Dictionary<string, string>();
}
