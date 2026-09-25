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
}
