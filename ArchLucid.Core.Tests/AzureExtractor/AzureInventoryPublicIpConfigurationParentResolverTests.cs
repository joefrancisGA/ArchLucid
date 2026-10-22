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
