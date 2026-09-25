using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryNetworkConnectionEndpointParserTests
{
    [Fact]
    public void Parse_reads_both_gateway_endpoints()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["connectionType"] = "IPsec",
            ["virtualNetworkGateway1.id"] =
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworkGateways/gw-a",
            ["localNetworkGateway2.id"] =
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/localNetworkGateways/lng-b",
        };

        AzureInventoryNetworkConnectionEndpointParseResult result =
            AzureInventoryNetworkConnectionEndpointParser.Parse(properties);

        result.ConnectionType.Should().Be("IPsec");
        result.Endpoint1ArmId.Should().Be(ArmResourceIdNormalizer.Normalize(properties["virtualNetworkGateway1.id"]));
        result.Endpoint2ArmId.Should().Be(ArmResourceIdNormalizer.Normalize(properties["localNetworkGateway2.id"]));
        result.HasBothEndpoints.Should().BeTrue();
    }

    [Fact]
    public void Parse_returns_partial_result_when_second_endpoint_missing()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["connectionType"] = "Vnet2Vnet",
            ["virtualNetworkGateway1.id"] =
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworkGateways/gw-a",
        };

        AzureInventoryNetworkConnectionEndpointParseResult result =
            AzureInventoryNetworkConnectionEndpointParser.Parse(properties);

        result.Endpoint1ArmId.Should().NotBeNullOrWhiteSpace();
        result.Endpoint2ArmId.Should().BeNull();
        result.HasBothEndpoints.Should().BeFalse();
    }
}
