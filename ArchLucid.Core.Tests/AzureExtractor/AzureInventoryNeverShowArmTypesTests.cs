using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
public sealed class AzureInventoryNeverShowArmTypesTests
{
    [Theory]
    [InlineData("Microsoft.Network/privateDnsZones/virtualNetworkLinks")]
    [InlineData("Microsoft.Network/dnsForwardingRulesets/virtualNetworkLinks")]
    [InlineData("microsoft.network/privatednszones/virtualnetworklinks")]
    public void ShouldOmitFromInventory_returns_true_for_virtual_network_link_types(string resourceType)
    {
        AzureInventoryNeverShowArmTypes.ShouldOmitFromInventory(resourceType).Should().BeTrue();
    }

    [Theory]
    [InlineData("Microsoft.Network/privateDnsZones")]
    [InlineData("Microsoft.Network/virtualNetworks")]
    [InlineData("Microsoft.Storage/storageAccounts")]
    [InlineData(null)]
    [InlineData("")]
    public void ShouldOmitFromInventory_returns_false_for_visible_inventory_types(string? resourceType)
    {
        AzureInventoryNeverShowArmTypes.ShouldOmitFromInventory(resourceType).Should().BeFalse();
    }
}
