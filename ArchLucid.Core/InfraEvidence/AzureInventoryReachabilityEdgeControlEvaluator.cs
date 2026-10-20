using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Core.InfraEvidence;

/// <summary>Evaluates stored network-edge controls for intended-reachability finalization (SN-APR-05).</summary>
public static class AzureInventoryReachabilityEdgeControlEvaluator
{
    public const string AllowedHopRoleName =
        "Allowed by stored control-plane rules; observed traffic was not evaluated.";

    private const string InternetSourceAddress = "*";

    private const string InternetDestinationAddress = "*";

    private const int DefaultDestinationPort = 443;

    private const string DefaultProtocol = "TCP";

    public static AzureInventoryNetworkEdgeControlDecision EvaluateSubnetFirewallRoute(
        string subnetArmId,
        IReadOnlyDictionary<string, AzureInventoryReachabilityResourceProperties> resourcesByArmId,
        IReadOnlyDictionary<string, string> subnetToFirewallArmId)
    {
        string normalizedSubnet = ArmResourceIdNormalizer.Normalize(subnetArmId);

        if (!subnetToFirewallArmId.TryGetValue(normalizedSubnet, out string? firewallArmId))
        {
            return AzureInventoryNetworkEdgeControlDecision.Unknown;
        }

        string normalizedFirewall = ArmResourceIdNormalizer.Normalize(firewallArmId);

        if (!resourcesByArmId.TryGetValue(normalizedFirewall, out AzureInventoryReachabilityResourceProperties? firewallResource))
        {
            return AzureInventoryNetworkEdgeControlDecision.Unknown;
        }

        if (!AzureInventoryAzureFirewallNetworkRuleParser.HasNetworkRuleCollections(firewallResource.Properties))
        {
            return AzureInventoryNetworkEdgeControlDecision.Unknown;
        }

        IReadOnlyList<AzureInventoryAzureFirewallNetworkRule> rules =
            AzureInventoryAzureFirewallNetworkRuleParser.Parse(firewallResource.Properties);

        bool hasApplicationRules =
            AzureInventoryAzureFirewallNetworkRuleParser.HasApplicationRuleCollections(firewallResource.Properties);

        return AzureInventoryAzureFirewallNetworkRuleEvaluator.Evaluate(
            rules,
            hasApplicationRules,
            InternetSourceAddress,
            InternetDestinationAddress,
            DefaultDestinationPort,
            DefaultProtocol);
    }

    public static AzureInventoryNetworkEdgeControlDecision EvaluateApplicationGateway(
        IReadOnlyDictionary<string, string> applicationGatewayProperties,
        string backendAssetArmId) =>
        AzureInventoryApplicationGatewayEdgeControlRuleParser.EvaluateBackendExposure(
            applicationGatewayProperties,
            backendAssetArmId);

    public static AzureInventoryNetworkEdgeControlDecision EvaluateFrontDoor(
        IReadOnlyDictionary<string, string> frontDoorProperties,
        string backendAssetArmId) =>
        AzureInventoryFrontDoorEdgeControlRuleParser.EvaluateOriginExposure(
            frontDoorProperties,
            backendAssetArmId);

    public static Dictionary<string, string> BuildSubnetToFirewallArmIdMap(
        IEnumerable<AzureInventoryRelationshipArmTriple> relationships,
        IReadOnlyDictionary<string, AzureInventoryReachabilityResourceProperties> resourcesByArmId)
    {
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(resourcesByArmId);

        Dictionary<string, string> subnetToRouteTable = BuildSubnetToRouteTableMap(relationships);
        Dictionary<string, string> subnetToFirewall = new(StringComparer.OrdinalIgnoreCase);

        foreach ((string subnetArmId, string routeTableArmId) in subnetToRouteTable)
        {
            if (!resourcesByArmId.TryGetValue(routeTableArmId, out AzureInventoryReachabilityResourceProperties? routeTable))
            {
                continue;
            }

            string? firewallArmId = TryResolveFirewallArmIdFromRouteTable(routeTable.Properties, resourcesByArmId);

            if (!string.IsNullOrWhiteSpace(firewallArmId))
            {
                subnetToFirewall[subnetArmId] = firewallArmId;
            }
        }

        return subnetToFirewall;
    }

    private static string? TryResolveFirewallArmIdFromRouteTable(
        IReadOnlyDictionary<string, string> routeTableProperties,
        IReadOnlyDictionary<string, AzureInventoryReachabilityResourceProperties> resourcesByArmId)
    {
        foreach (AzureInventoryRouteTableRoute route in AzureInventoryRouteTableRouteParser.Parse(routeTableProperties))
        {
            if (string.IsNullOrWhiteSpace(route.NextHopType)
                || !route.NextHopType.Equals("VirtualAppliance", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(route.NextHopArmId))
            {
                continue;
            }

            string normalizedNextHop = ArmResourceIdNormalizer.Normalize(route.NextHopArmId);

            if (!resourcesByArmId.TryGetValue(normalizedNextHop, out AzureInventoryReachabilityResourceProperties? nextHopResource))
            {
                continue;
            }

            if (nextHopResource.ResourceType.Contains("azureFirewalls", StringComparison.OrdinalIgnoreCase))
            {
                return normalizedNextHop;
            }
        }

        return null;
    }

    private static Dictionary<string, string> BuildSubnetToRouteTableMap(
        IEnumerable<AzureInventoryRelationshipArmTriple> relationships)
    {
        Dictionary<string, string> map = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryRelationshipArmTriple relationship in relationships)
        {
            if (!string.Equals(relationship.InferenceSource, "inventory-subnet-route-table", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            map[ArmResourceIdNormalizer.Normalize(relationship.FromAzureResourceId)] =
                ArmResourceIdNormalizer.Normalize(relationship.ToAzureResourceId);
        }

        return map;
    }
}
