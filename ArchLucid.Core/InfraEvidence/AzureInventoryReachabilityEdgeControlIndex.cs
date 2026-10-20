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
    private readonly Dictionary<string, string> _applicationGatewayByBackendArmId;
    private readonly Dictionary<string, string> _frontDoorByBackendArmId;

    private AzureInventoryReachabilityEdgeControlIndex(
        HashSet<string> subnetsWithUnmodeledEdgeRoute,
        HashSet<string> assetsBehindApplicationGateway,
        HashSet<string> assetsBehindFrontDoor,
        Dictionary<string, string> applicationGatewayByBackendArmId,
        Dictionary<string, string> frontDoorByBackendArmId)
    {
        _subnetsWithUnmodeledEdgeRoute = subnetsWithUnmodeledEdgeRoute;
        _assetsBehindApplicationGateway = assetsBehindApplicationGateway;
        _assetsBehindFrontDoor = assetsBehindFrontDoor;
        _applicationGatewayByBackendArmId = applicationGatewayByBackendArmId;
        _frontDoorByBackendArmId = frontDoorByBackendArmId;
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

    public bool TryGetApplicationGatewayForBackend(string backendArmId, out string applicationGatewayArmId)
    {
        string normalizedBackend = ArmResourceIdNormalizer.Normalize(backendArmId);

        if (_applicationGatewayByBackendArmId.TryGetValue(normalizedBackend, out applicationGatewayArmId!))
        {
            return true;
        }

        foreach ((string backend, string gateway) in _applicationGatewayByBackendArmId)
        {
            if (ArmResourceIdNormalizer.IsDescendantOf(normalizedBackend, backend)
                || ArmResourceIdNormalizer.IsDescendantOf(backend, normalizedBackend))
            {
                applicationGatewayArmId = gateway;

                return true;
            }
        }

        applicationGatewayArmId = string.Empty;

        return false;
    }

    public bool TryGetFrontDoorForBackend(string backendArmId, out string frontDoorArmId)
    {
        string normalizedBackend = ArmResourceIdNormalizer.Normalize(backendArmId);

        if (_frontDoorByBackendArmId.TryGetValue(normalizedBackend, out frontDoorArmId!))
        {
            return true;
        }

        foreach ((string backend, string frontDoor) in _frontDoorByBackendArmId)
        {
            if (ArmResourceIdNormalizer.IsDescendantOf(normalizedBackend, backend)
                || ArmResourceIdNormalizer.IsDescendantOf(backend, normalizedBackend))
            {
                frontDoorArmId = frontDoor;

                return true;
            }
        }

        frontDoorArmId = string.Empty;

        return false;
    }

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
        Dictionary<string, string> applicationGatewayByBackendArmId = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, string> frontDoorByBackendArmId = new(StringComparer.OrdinalIgnoreCase);

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
                string backendArmId = ArmResourceIdNormalizer.Normalize(relationship.ToAzureResourceId);
                string gatewayArmId = ArmResourceIdNormalizer.Normalize(relationship.FromAzureResourceId);

                assetsBehindApplicationGateway.Add(backendArmId);
                applicationGatewayByBackendArmId[backendArmId] = gatewayArmId;
            }

            if (string.Equals(relationship.InferenceSource, InferenceSources.FrontDoorOrigin, StringComparison.OrdinalIgnoreCase))
            {
                string backendArmId = ArmResourceIdNormalizer.Normalize(relationship.ToAzureResourceId);
                string frontDoorArmId = ArmResourceIdNormalizer.Normalize(relationship.FromAzureResourceId);

                assetsBehindFrontDoor.Add(backendArmId);
                frontDoorByBackendArmId[backendArmId] = frontDoorArmId;
            }
        }

        return new AzureInventoryReachabilityEdgeControlIndex(
            subnetsWithUnmodeledEdgeRoute,
            assetsBehindApplicationGateway,
            assetsBehindFrontDoor,
            applicationGatewayByBackendArmId,
            frontDoorByBackendArmId);
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

            if (nextHopResource.ResourceType.Contains("azureFirewalls", StringComparison.OrdinalIgnoreCase))
            {
                if (AzureInventoryAzureFirewallNetworkRuleParser.HasNetworkRuleCollections(nextHopResource.Properties))
                {
                    return false;
                }

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
