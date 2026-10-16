using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryRouteTableRouteParserTests
{
    [Fact]
    public void Parse_reads_routes_from_json_property()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                """
                [
                  {
                    "name": "to-firewall",
                    "properties": {
                      "addressPrefix": "10.1.0.0/24",
                      "nextHopType": "VirtualAppliance",
                      "nextHopIpAddress": "10.0.0.4"
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].AddressPrefix.Should().Be("10.1.0.0/24");
        routes[0].NextHopType.Should().Be("VirtualAppliance");
        routes[0].NextHopIpAddress.Should().Be("10.0.0.4");
    }

    [Fact]
    public void Parse_reads_next_hop_type_when_routes_json_uses_pascal_case_property_name()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                """
                [
                  {
                    "properties": {
                      "addressPrefix": "0.0.0.0/0",
                      "NextHopType": "VirtualNetworkGateway"
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopType.Should().Be("VirtualNetworkGateway");
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_nested_object_uses_pascal_case_id_property()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.0.0.0/8",
                      "nextHopType": "VirtualAppliance",
                      "nextHop": { "Id": "{{nvaArmId}}" }
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_explicit_flattened_route_properties_when_suffix_casing_differs()
    {
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}.AddressPrefix"] = "10.1.0.0/24",
            [$"{routePrefix}.NextHopType"] = "VirtualAppliance",
            [$"{routePrefix}.NextHopIpAddress"] = "10.0.0.4",
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].AddressPrefix.Should().Be("10.1.0.0/24");
        routes[0].NextHopType.Should().Be("VirtualAppliance");
        routes[0].NextHopIpAddress.Should().Be("10.0.0.4");
    }
}
