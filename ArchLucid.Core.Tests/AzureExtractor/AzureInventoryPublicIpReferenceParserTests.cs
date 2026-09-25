using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryPublicIpReferenceParserTests
{
    private const string PublicIpArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip-front";

    [Fact]
    public void Parse_load_balancer_frontend_configuration_returns_public_ip_arm_id()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["frontendIPConfigurations"] =
                "[{\"properties\":{\"publicIPAddress\":{\"id\":\"" + PublicIpArmId + "\"}}}]",
        };

        IReadOnlyList<string> publicIpArmIds = AzureInventoryPublicIpReferenceParser.Parse(properties);

        publicIpArmIds.Should().ContainSingle(id =>
            id.Equals(PublicIpArmId, StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Parse_without_public_ip_reference_returns_empty()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["backendAddressPools"] = "[]",
        };

        AzureInventoryPublicIpReferenceParser.Parse(properties).Should().BeEmpty();
    }
}
