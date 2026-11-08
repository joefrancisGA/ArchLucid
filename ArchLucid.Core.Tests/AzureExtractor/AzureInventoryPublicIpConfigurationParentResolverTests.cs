using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryPublicIpConfigurationParentResolverTests
{
    [Theory]
    [InlineData(
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1/ipConfigurations/ipconfig1",
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1")]
    [InlineData(
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/loadBalancers/lb1/frontendIPConfigurations/fe1",
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/loadBalancers/lb1")]
    [InlineData(
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/bastionHosts/bastion1/bastionHostIpConfigurations/ipconfig",
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/bastionHosts/bastion1")]
    [InlineData(
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1/azureFirewallIpConfigurations/ipconfig",
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1")]
    public void Resolves_parent_before_last_ip_configuration_segment(
        string configurationId,
        string expectedParentId)
    {
        string? parentId =
            AzureInventoryPublicIpConfigurationParentResolver.TryResolveParentArmId(configurationId);

        parentId.Should().Be(expectedParentId);
    }

    [Fact]
    public void Resolves_parent_when_configuration_id_is_percent_encoded_plain_arm_scalar()
    {
        const string plain =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1/ipConfigurations/ipconfig1";
        string encoded = Uri.EscapeDataString(plain);

        string? parentId = AzureInventoryPublicIpConfigurationParentResolver.TryResolveParentArmId(encoded);

        parentId.Should().Be(
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1");
    }

    [Fact]
    public void Resolves_parent_when_configuration_id_is_double_percent_encoded()
    {
        const string plain =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1/ipConfigurations/ipconfig1";
        string encoded = Uri.EscapeDataString(Uri.EscapeDataString(plain));

        AzureInventoryPublicIpConfigurationParentResolver.TryResolveParentArmId(encoded)
            .Should()
            .Be("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1");
    }

    [Theory]
    [InlineData("100%")]
    [InlineData("%ZZ")]
    [InlineData("foo%2")]
    public void Returns_null_without_throwing_for_malformed_percent_encoding(string configurationId)
    {
        Action act = () => AzureInventoryPublicIpConfigurationParentResolver.TryResolveParentArmId(configurationId);

        act.Should().NotThrow();
        AzureInventoryPublicIpConfigurationParentResolver.TryResolveParentArmId(configurationId)
            .Should()
            .BeNull();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("/subscriptions/sub/providers/Microsoft.Network/publicIPAddresses/pip1")]
    public void Returns_null_when_configuration_id_has_no_ip_configuration_segment(string? configurationId)
    {
        AzureInventoryPublicIpConfigurationParentResolver.TryResolveParentArmId(configurationId)
            .Should()
            .BeNull();
    }
}
