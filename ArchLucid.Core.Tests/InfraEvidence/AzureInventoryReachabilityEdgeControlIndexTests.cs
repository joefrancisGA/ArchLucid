using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryReachabilityEdgeControlIndexTests
{
    private const string SubscriptionId = "11111111-1111-1111-1111-111111111111";

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_for_virtual_network_gateway_route()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualNetworkGateway",
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue();
    }

    [Fact]
    public void AssetDeclaredBehindApplicationGateway_true_for_agw_backend_relationship()
    {
        string app = BuildWebApp("api");
        string agw = BuildApplicationGateway("agw");

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(agw, app, "inventory-agw-backend"),
        ], new Dictionary<string, AzureInventoryReachabilityResourceProperties>());

        index.AssetDeclaredBehindApplicationGateway(app).Should().BeTrue();
    }

    private static string BuildVnet(string name) =>
        $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/{name}";

    private static string BuildSubnet(string vnetArmId, string subnetName) =>
        $"{vnetArmId}/subnets/{subnetName}";

    private static string BuildRouteTable(string name) =>
        $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/routeTables/{name}";

    private static string BuildWebApp(string name) =>
        $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Web/sites/{name}";

    private static string BuildApplicationGateway(string name) =>
        $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/applicationGateways/{name}";
}
