using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryReachabilityEdgeControlIndexTests
{
    private const string SubscriptionId = "11111111-1111-1111-1111-111111111111";

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_for_virtual_network_gateway_route_in_routes_json()
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
                        ["routes"] = """
                            [
                              {
                                "properties": {
                                  "addressPrefix": "0.0.0.0/0",
                                  "nextHopType": "VirtualNetworkGateway"
                                }
                              }
                            ]
                            """,
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
    public void SubnetRequiresEdgeControlEvidence_false_when_routes_json_virtual_appliance_next_hop_is_in_snapshot()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string nva = BuildNetworkVirtualAppliance("nva");

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["routes"] = $$"""
                            [
                              {
                                "properties": {
                                  "addressPrefix": "10.0.0.0/8",
                                  "nextHopType": "VirtualAppliance",
                                  "nextHopIpAddress": "10.0.0.4",
                                  "nextHop": { "id": "{{nva}}" }
                                }
                              }
                            ]
                            """,
                    },
                },
                [nva] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/networkVirtualAppliances",
                    Properties = new Dictionary<string, string>(),
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeFalse();
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_false_when_virtual_appliance_next_hop_is_in_snapshot()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string nva = BuildNetworkVirtualAppliance("nva");

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "10.0.0.0/8",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = nva,
                    },
                },
                [nva + "/"] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/networkVirtualAppliances",
                    Properties = new Dictionary<string, string>(),
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeFalse(
            "a modeled virtual appliance next hop should not force indeterminate edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_virtual_appliance_next_hop_arm_id_not_in_snapshot()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string missingNva =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/missing";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "10.0.0.0/8",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = missingNva,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "unresolved virtual appliance next hops must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_virtual_appliance_next_hop_has_empty_arm_id()
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
                        ["inventory.policy.route.0.addressPrefix"] = "10.0.0.0/8",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = "   ",
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "virtual appliance routes with blank next hop ARM id must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_false_when_explicit_route_uses_internet_next_hop_type()
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
                        ["inventory.policy.route.0.nextHopType"] = "Internet",
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeFalse(
            "Internet next-hop routes are not unmodeled virtual appliance edge-control gaps");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_false_when_explicit_route_uses_vnet_local_next_hop_type()
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
                        ["inventory.policy.route.0.addressPrefix"] = "10.0.0.0/16",
                        ["inventory.policy.route.0.nextHopType"] = "VnetLocal",
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeFalse(
            "VnetLocal next-hop routes are not unmodeled virtual appliance edge-control gaps");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_false_when_explicit_route_uses_global_next_hop_type()
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
                        ["inventory.policy.route.0.nextHopType"] = "Global",
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeFalse(
            "Global next-hop routes are not unmodeled virtual appliance edge-control gaps");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_false_when_explicit_route_uses_express_route_gateway_next_hop_type()
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
                        ["inventory.policy.route.0.addressPrefix"] = "10.0.0.0/16",
                        ["inventory.policy.route.0.nextHopType"] = "ExpressRouteGateway",
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeFalse(
            "ExpressRouteGateway next-hop routes are not unmodeled virtual appliance edge-control gaps");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_false_when_explicit_route_uses_vpn_gateway_next_hop_type()
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
                        ["inventory.policy.route.0.addressPrefix"] = "10.0.0.0/16",
                        ["inventory.policy.route.0.nextHopType"] = "VPNGateway",
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeFalse(
            "VPNGateway next-hop routes are not unmodeled virtual appliance edge-control gaps");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_false_when_explicit_route_has_none_next_hop_type()
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
                        ["inventory.policy.route.0.nextHopType"] = "None",
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeFalse(
            "None next-hop routes are not unmodeled virtual appliance edge-control gaps");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_false_when_explicit_route_has_empty_next_hop_type()
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
                        ["inventory.policy.route.0.addressPrefix"] = "10.0.0.0/16",
                        ["inventory.policy.route.0.nextHopType"] = "",
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeFalse(
            "empty next-hop type routes are not unmodeled virtual appliance edge-control gaps");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_false_when_explicit_route_has_whitespace_only_next_hop_type()
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
                        ["inventory.policy.route.0.addressPrefix"] = "10.0.0.0/16",
                        ["inventory.policy.route.0.nextHopType"] = "   ",
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeFalse(
            "whitespace-only next-hop type routes are not unmodeled virtual appliance edge-control gaps");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_false_when_explicit_route_uses_virtual_network_next_hop_type()
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
                        ["inventory.policy.route.0.addressPrefix"] = "10.0.0.0/16",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualNetwork",
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeFalse(
            "VirtualNetwork next-hop routes are not unmodeled virtual appliance edge-control gaps");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_false_when_explicit_route_uses_virtual_network_service_endpoint_next_hop_type()
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
                        ["inventory.policy.route.0.addressPrefix"] = "10.0.0.0/16",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualNetworkServiceEndpoint",
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeFalse(
            "VirtualNetworkServiceEndpoint next-hop routes are not unmodeled virtual appliance edge-control gaps");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_false_when_explicit_route_uses_hyper_net_gateway_next_hop_type()
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
                        ["inventory.policy.route.0.addressPrefix"] = "10.0.0.0/16",
                        ["inventory.policy.route.0.nextHopType"] = "HyperNetGateway",
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeFalse(
            "HyperNetGateway next-hop routes are not unmodeled virtual appliance edge-control gaps");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_routes_json_uses_pascal_case_next_hop_type()
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
                        ["routes"] = """
                            [
                              {
                                "properties": {
                                  "addressPrefix": "0.0.0.0/0",
                                  "NextHopType": "VirtualNetworkGateway"
                                }
                              }
                            ]
                            """,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "routes JSON must accept NextHopType casing variants from ARM exports");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_routes_property_key_uses_pascal_case()
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
                    Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        ["Routes"] = """
                            [
                              {
                                "properties": {
                                  "addressPrefix": "0.0.0.0/0",
                                  "nextHopType": "VirtualNetworkGateway"
                                }
                              }
                            ]
                            """,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "route table inventory must accept Routes property key casing variants");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_routes_json_lists_string_scalar_route_elements()
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
                        ["routes"] = """
                            [
                              "{\"properties\":{\"addressPrefix\":\"0.0.0.0/0\",\"nextHopType\":\"VirtualNetworkGateway\"}}"
                            ]
                            """,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "routes JSON must accept route elements encoded as JSON string scalars");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_explicit_flattened_route_lists_only_next_hop_type()
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
                        ["inventory.policy.route.0.nextHopType"] = "VirtualNetworkGateway",
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "flattened route tables must surface VNet gateway routes when only nextHopType keys are projected");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_explicit_route_has_prefix_only_and_routes_json_lists_next_hop()
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
                        ["routes"] = """
                            [
                              {
                                "properties": {
                                  "addressPrefix": "0.0.0.0/0",
                                  "nextHopType": "VirtualNetworkGateway"
                                }
                              }
                            ]
                            """,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "prefix-only explicit route slots must not suppress routes JSON next-hop fields");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_placeholder_explicit_route_coexists_with_routes_json()
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
                        ["inventory.policy.route.0.addressPrefix"] = string.Empty,
                        ["routes"] = """
                            [
                              {
                                "properties": {
                                  "addressPrefix": "0.0.0.0/0",
                                  "nextHopType": "VirtualNetworkGateway"
                                }
                              }
                            ]
                            """,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "placeholder explicit route slots must not suppress routes JSON for edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_routes_json_lists_route_fields_without_properties_bag()
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
                        ["routes"] = """
                            [
                              {
                                "addressPrefix": "0.0.0.0/0",
                                "nextHopType": "VirtualNetworkGateway"
                              }
                            ]
                            """,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "flattened routes JSON must accept route fields without a properties wrapper");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_routes_json_is_string_scalar_wrapping_route_array()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string innerRoutes =
            """
            [
              {
                "properties": {
                  "addressPrefix": "0.0.0.0/0",
                  "nextHopType": "VirtualNetworkGateway"
                }
              }
            ]
            """;

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["routes"] = System.Text.Json.JsonSerializer.Serialize(innerRoutes),
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "double-encoded routes JSON strings must still surface VNet gateway edge-control routes");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_routes_json_uses_pascal_case_properties_bag()
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
                        ["routes"] = """
                            [
                              {
                                "Properties": {
                                  "addressPrefix": "0.0.0.0/0",
                                  "nextHopType": "VirtualNetworkGateway"
                                }
                              }
                            ]
                            """,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "routes JSON must accept Properties casing variants from ARM exports");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_false_when_routes_json_next_hop_uses_pascal_case_id_property()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string nva = BuildNetworkVirtualAppliance("nva");

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["routes"] = $$"""
                            [
                              {
                                "properties": {
                                  "addressPrefix": "10.0.0.0/8",
                                  "nextHopType": "VirtualAppliance",
                                  "nextHop": { "Id": "{{nva}}" }
                                }
                              }
                            ]
                            """,
                    },
                },
                [nva] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/networkVirtualAppliances",
                    Properties = new Dictionary<string, string>(),
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeFalse(
            "routes JSON nextHop objects must accept Id casing variants from ARM exports");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_whitespace_only_network_rule_collections_property()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "   ",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "whitespace-only networkRuleCollections must not suppress edge-control evidence for firewall hops");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_empty_network_rule_collections_json_array()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "empty networkRuleCollections JSON arrays must not suppress edge-control evidence for firewall hops");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_all_rule_collection_properties_empty_json_arrays()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[]",
                        ["natRuleCollections"] = "[]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with empty network, application, and NAT rule collections must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_no_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops without rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_whitespace_only_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "   ",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "\t",
                        ["natRuleCollections"] = " ",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with whitespace-only rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_invalid_json_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "{not-json",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[[",
                        ["natRuleCollections"] = "broken",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with invalid JSON rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_object_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "{}",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "{}",
                        ["natRuleCollections"] = "{}",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON object rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] =
                            System.Text.Json.JsonSerializer.Serialize("[]"),
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] =
                            System.Text.Json.JsonSerializer.Serialize("not-an-array"),
                        ["natRuleCollections"] = System.Text.Json.JsonSerializer.Serialize("[]"),
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_number_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "42",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "0",
                        ["natRuleCollections"] = "3.14",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON number rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_boolean_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "true",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "false",
                        ["natRuleCollections"] = "true",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON boolean rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_null_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "null",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "null",
                        ["natRuleCollections"] = "null",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON null rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_numbers_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[1,2,3]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[4,5,6]",
                        ["natRuleCollections"] = "[7,8,9]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-numbers rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_booleans_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[true,false]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[true,false]",
                        ["natRuleCollections"] = "[true,false]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-booleans rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_strings_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[\"a\",\"b\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[\"a\",\"b\"]",
                        ["natRuleCollections"] = "[\"a\",\"b\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-strings rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_empty_objects_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[{}]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[{}]",
                        ["natRuleCollections"] = "[{}]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-empty-objects rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_nulls_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[null]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[null]",
                        ["natRuleCollections"] = "[null]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-nulls rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_mixed_type_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[1,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[1,\"a\"]",
                        ["natRuleCollections"] = "[1,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-mixed-type rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_null_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[null,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[null,\"a\"]",
                        ["natRuleCollections"] = "[null,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-null-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_boolean_and_null_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[true,null]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[true,null]",
                        ["natRuleCollections"] = "[true,null]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-boolean-and-null rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_and_null_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[1,null]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[1,null]",
                        ["natRuleCollections"] = "[1,null]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-and-null rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_boolean_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[true,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[true,\"a\"]",
                        ["natRuleCollections"] = "[true,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-boolean-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[1,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[1,\"a\"]",
                        ["natRuleCollections"] = "[1,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_false_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[false,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[false,\"a\"]",
                        ["natRuleCollections"] = "[false,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-false-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_two_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[2,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[2,\"a\"]",
                        ["natRuleCollections"] = "[2,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-two-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_three_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[3,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[3,\"a\"]",
                        ["natRuleCollections"] = "[3,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-three-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_four_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[4,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[4,\"a\"]",
                        ["natRuleCollections"] = "[4,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-four-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_five_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[5,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[5,\"a\"]",
                        ["natRuleCollections"] = "[5,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-five-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_six_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[6,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[6,\"a\"]",
                        ["natRuleCollections"] = "[6,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-six-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_seven_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[7,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[7,\"a\"]",
                        ["natRuleCollections"] = "[7,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-seven-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_eight_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[8,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[8,\"a\"]",
                        ["natRuleCollections"] = "[8,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-eight-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_nine_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[9,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[9,\"a\"]",
                        ["natRuleCollections"] = "[9,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-nine-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_ten_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[10,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[10,\"a\"]",
                        ["natRuleCollections"] = "[10,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-ten-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_eleven_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[11,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[11,\"a\"]",
                        ["natRuleCollections"] = "[11,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-eleven-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_twelve_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[12,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[12,\"a\"]",
                        ["natRuleCollections"] = "[12,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-twelve-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_thirteen_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[13,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[13,\"a\"]",
                        ["natRuleCollections"] = "[13,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-thirteen-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_fourteen_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[14,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[14,\"a\"]",
                        ["natRuleCollections"] = "[14,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-fourteen-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_fifteen_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[15,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[15,\"a\"]",
                        ["natRuleCollections"] = "[15,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-fifteen-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_sixteen_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[16,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[16,\"a\"]",
                        ["natRuleCollections"] = "[16,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-sixteen-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_seventeen_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[17,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[17,\"a\"]",
                        ["natRuleCollections"] = "[17,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-seventeen-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_eighteen_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[18,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[18,\"a\"]",
                        ["natRuleCollections"] = "[18,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-eighteen-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_nineteen_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[19,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[19,\"a\"]",
                        ["natRuleCollections"] = "[19,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-nineteen-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_twenty_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[20,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[20,\"a\"]",
                        ["natRuleCollections"] = "[20,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-twenty-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_twenty_one_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[21,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[21,\"a\"]",
                        ["natRuleCollections"] = "[21,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-twenty-one-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_twenty_two_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[22,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[22,\"a\"]",
                        ["natRuleCollections"] = "[22,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-twenty-two-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_twenty_three_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[23,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[23,\"a\"]",
                        ["natRuleCollections"] = "[23,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-twenty-three-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_twenty_four_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[24,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[24,\"a\"]",
                        ["natRuleCollections"] = "[24,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-twenty-four-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_twenty_five_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[25,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[25,\"a\"]",
                        ["natRuleCollections"] = "[25,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-twenty-five-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_twenty_six_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[26,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[26,\"a\"]",
                        ["natRuleCollections"] = "[26,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-twenty-six-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_twenty_seven_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[27,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[27,\"a\"]",
                        ["natRuleCollections"] = "[27,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-twenty-seven-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_twenty_eight_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[28,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[28,\"a\"]",
                        ["natRuleCollections"] = "[28,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-twenty-eight-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_twenty_nine_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[29,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[29,\"a\"]",
                        ["natRuleCollections"] = "[29,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-twenty-nine-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_thirty_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[30,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[30,\"a\"]",
                        ["natRuleCollections"] = "[30,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-thirty-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_thirty_one_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[31,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[31,\"a\"]",
                        ["natRuleCollections"] = "[31,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-thirty-one-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_thirty_two_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[32,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[32,\"a\"]",
                        ["natRuleCollections"] = "[32,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-thirty-two-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_thirty_three_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[33,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[33,\"a\"]",
                        ["natRuleCollections"] = "[33,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-thirty-three-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_thirty_four_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[34,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[34,\"a\"]",
                        ["natRuleCollections"] = "[34,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-thirty-four-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_thirty_five_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[35,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[35,\"a\"]",
                        ["natRuleCollections"] = "[35,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-thirty-five-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_thirty_six_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[36,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[36,\"a\"]",
                        ["natRuleCollections"] = "[36,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-thirty-six-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_thirty_seven_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[37,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[37,\"a\"]",
                        ["natRuleCollections"] = "[37,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-thirty-seven-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_thirty_eight_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[38,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[38,\"a\"]",
                        ["natRuleCollections"] = "[38,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-thirty-eight-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_thirty_nine_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[39,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[39,\"a\"]",
                        ["natRuleCollections"] = "[39,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-thirty-nine-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_forty_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[40,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[40,\"a\"]",
                        ["natRuleCollections"] = "[40,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-forty-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_forty_one_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[41,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[41,\"a\"]",
                        ["natRuleCollections"] = "[41,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-forty-one-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_forty_two_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[42,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[42,\"a\"]",
                        ["natRuleCollections"] = "[42,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-forty-two-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_forty_three_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[43,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[43,\"a\"]",
                        ["natRuleCollections"] = "[43,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-forty-three-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_forty_four_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[44,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[44,\"a\"]",
                        ["natRuleCollections"] = "[44,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-forty-four-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_forty_five_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[45,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[45,\"a\"]",
                        ["natRuleCollections"] = "[45,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-forty-five-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_forty_six_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[46,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[46,\"a\"]",
                        ["natRuleCollections"] = "[46,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-forty-six-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_forty_seven_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[47,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[47,\"a\"]",
                        ["natRuleCollections"] = "[47,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-forty-seven-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_forty_eight_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[48,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[48,\"a\"]",
                        ["natRuleCollections"] = "[48,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-forty-eight-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_forty_nine_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[49,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[49,\"a\"]",
                        ["natRuleCollections"] = "[49,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-forty-nine-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_fifty_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[50,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[50,\"a\"]",
                        ["natRuleCollections"] = "[50,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-fifty-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_fifty_one_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[51,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[51,\"a\"]",
                        ["natRuleCollections"] = "[51,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-fifty-one-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_fifty_two_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[52,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[52,\"a\"]",
                        ["natRuleCollections"] = "[52,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-fifty-two-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_fifty_three_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[53,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[53,\"a\"]",
                        ["natRuleCollections"] = "[53,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-fifty-three-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_fifty_four_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[54,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[54,\"a\"]",
                        ["natRuleCollections"] = "[54,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-fifty-four-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_fifty_five_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[55,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[55,\"a\"]",
                        ["natRuleCollections"] = "[55,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-fifty-five-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_fifty_six_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[56,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[56,\"a\"]",
                        ["natRuleCollections"] = "[56,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-fifty-six-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_fifty_seven_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[57,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[57,\"a\"]",
                        ["natRuleCollections"] = "[57,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-fifty-seven-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_fifty_eight_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[58,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[58,\"a\"]",
                        ["natRuleCollections"] = "[58,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-fifty-eight-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_fifty_nine_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[59,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[59,\"a\"]",
                        ["natRuleCollections"] = "[59,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-fifty-nine-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_sixty_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[60,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[60,\"a\"]",
                        ["natRuleCollections"] = "[60,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-sixty-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_sixty_one_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[61,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[61,\"a\"]",
                        ["natRuleCollections"] = "[61,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-sixty-one-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_sixty_two_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[62,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[62,\"a\"]",
                        ["natRuleCollections"] = "[62,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-sixty-two-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_sixty_three_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[63,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[63,\"a\"]",
                        ["natRuleCollections"] = "[63,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-sixty-three-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_sixty_four_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[64,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[64,\"a\"]",
                        ["natRuleCollections"] = "[64,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-sixty-four-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_sixty_five_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[65,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[65,\"a\"]",
                        ["natRuleCollections"] = "[65,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-sixty-five-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_sixty_six_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[66,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[66,\"a\"]",
                        ["natRuleCollections"] = "[66,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-sixty-six-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_sixty_seven_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[67,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[67,\"a\"]",
                        ["natRuleCollections"] = "[67,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-sixty-seven-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_sixty_eight_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[68,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[68,\"a\"]",
                        ["natRuleCollections"] = "[68,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-sixty-eight-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_sixty_nine_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[69,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[69,\"a\"]",
                        ["natRuleCollections"] = "[69,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-sixty-nine-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_seventy_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[70,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[70,\"a\"]",
                        ["natRuleCollections"] = "[70,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-seventy-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_seventy_one_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[71,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[71,\"a\"]",
                        ["natRuleCollections"] = "[71,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-seventy-one-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_json_array_of_number_seventy_two_and_string_rule_collection_properties()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[72,\"a\"]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[72,\"a\"]",
                        ["natRuleCollections"] = "[72,\"a\"]",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "firewall hops with JSON array-of-number-seventy-two-and-string rule collection properties must still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_placeholder_collections_with_empty_rules()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = """
                            [
                              {
                                "properties": {
                                  "priority": 200,
                                  "rules": []
                                }
                              }
                            ]
                            """,
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "placeholder networkRuleCollections with empty rules must not suppress edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_whitespace_only_application_rule_collections_property()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "   ",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "   ",
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "whitespace-only applicationRuleCollections does not suppress edge-control evidence when networkRuleCollections is also absent");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_nat_rule_collections_only()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[]",
                        ["natRuleCollections"] = """
                            [
                              {
                                "properties": {
                                  "priority": 100,
                                  "action": { "type": "Dnat" },
                                  "rules": [
                                    {
                                      "properties": {
                                        "name": "nat1",
                                        "protocols": [ "TCP" ],
                                        "sourceAddresses": [ "*" ],
                                        "destinationAddresses": [ "1.2.3.4" ],
                                        "destinationPorts": [ "443" ],
                                        "translatedAddress": "10.0.0.5",
                                        "translatedPort": "8443"
                                      }
                                    }
                                  ]
                                }
                              }
                            ]
                            """,
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "NAT-only firewall hops without parsed network rules still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_true_when_firewall_next_hop_has_application_rule_collections_only()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[]",
                        [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = """
                            [
                              {
                                "properties": {
                                  "priority": 100,
                                  "action": { "type": "Allow" },
                                  "rules": [
                                    {
                                      "properties": {
                                        "name": "allow-example",
                                        "protocols": [ "Https" ],
                                        "sourceAddresses": [ "*" ],
                                        "targetFqdns": [ "www.example.com" ]
                                      }
                                    }
                                  ]
                                }
                              }
                            ]
                            """,
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeTrue(
            "application-only firewall hops without parsed network rules still require edge-control evidence");
    }

    [Fact]
    public void SubnetRequiresEdgeControlEvidence_false_when_firewall_next_hop_has_parseable_network_rule_collections()
    {
        string vnet = BuildVnet("vnet");
        string subnet = BuildSubnet(vnet, "app");
        string routeTable = BuildRouteTable("routes");
        string firewall =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";

        Dictionary<string, AzureInventoryReachabilityResourceProperties> resources =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [firewall] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/azureFirewalls",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = """
                            [
                              {
                                "properties": {
                                  "priority": 200,
                                  "rules": [
                                    {
                                      "properties": {
                                        "name": "allow-internet",
                                        "priority": 100,
                                        "action": { "type": "Allow" },
                                        "sourceAddresses": ["*"],
                                        "destinationAddresses": ["*"],
                                        "destinationPorts": ["*"],
                                        "ipProtocols": ["TCP"]
                                      }
                                    }
                                  ]
                                }
                              }
                            ]
                            """,
                    },
                },
                [routeTable] = new AzureInventoryReachabilityResourceProperties
                {
                    ResourceType = "Microsoft.Network/routeTables",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["inventory.policy.route.0.addressPrefix"] = "0.0.0.0/0",
                        ["inventory.policy.route.0.nextHopType"] = "VirtualAppliance",
                        ["inventory.policy.route.0.nextHopArmId"] = firewall,
                    },
                },
            };

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(subnet, routeTable, "inventory-subnet-route-table"),
        ], resources);

        index.SubnetRequiresEdgeControlEvidence(subnet).Should().BeFalse(
            "modeled firewall hops with parsed network rules suppress edge-control evidence by design");
    }

    [Fact]
    public void AssetDeclaredBehindFrontDoor_true_for_front_door_origin_relationship()
    {
        string app = BuildWebApp("api");
        string frontDoor = BuildFrontDoor("fd");

        AzureInventoryReachabilityEdgeControlIndex index = AzureInventoryReachabilityEdgeControlIndex.Build(
        [
            new AzureInventoryRelationshipArmTriple(frontDoor, app, "inventory-front-door-origin"),
        ], new Dictionary<string, AzureInventoryReachabilityResourceProperties>());

        index.AssetDeclaredBehindFrontDoor(app).Should().BeTrue();
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

    private static string BuildFrontDoor(string name) =>
        $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Cdn/profiles/{name}";

    private static string BuildNetworkVirtualAppliance(string name) =>
        $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/{name}";
}
