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
    public void Parse_reads_arm_id_from_json_reference_property_values()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["properties.publicIPAddress"] =
                """
                {"id":"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip-front"}
                """,
        };

        IReadOnlyList<string> publicIpArmIds = AzureInventoryPublicIpReferenceParser.Parse(properties);

        publicIpArmIds.Should().ContainSingle(id =>
            id.Equals(PublicIpArmId, StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Parse_reads_arm_id_from_json_blob_when_inner_key_uses_capital_Id_casing()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["properties.publicIPAddress"] =
                """
                {"Id":"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip-front"}
                """,
        };

        IReadOnlyList<string> publicIpArmIds = AzureInventoryPublicIpReferenceParser.Parse(properties);

        publicIpArmIds.Should().ContainSingle(id =>
            id.Equals(PublicIpArmId, StringComparison.OrdinalIgnoreCase));
    }

    [Theory]
    [InlineData("frontendIPConfigurations")]
    [InlineData("ipConfigurations")]
    [InlineData("properties.publicIPAddress")]
    public void Parse_ignores_non_public_ip_scalar_reference(string propertyName)
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [propertyName] =
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/loadBalancers/lb/frontendIPConfigurations/front",
        };

        AzureInventoryPublicIpReferenceParser.Parse(properties).Should().BeEmpty();
    }

    [Fact]
    public void Parse_trims_scalar_public_ip_reference()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["properties.publicIPAddress"] = $"  {PublicIpArmId}  ",
        };

        AzureInventoryPublicIpReferenceParser.Parse(properties).Should().ContainSingle(id =>
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
