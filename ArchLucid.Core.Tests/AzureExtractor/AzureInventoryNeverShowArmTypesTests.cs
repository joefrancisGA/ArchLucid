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
    [InlineData("Microsoft.Portal/dashboards")]
    [InlineData("Microsoft.Network/dnszones")]
    [InlineData("Microsoft.Network/privateDnsZones")]
    [InlineData("Microsoft.Network/dnsResolvers")]
    [InlineData("Microsoft.Compute/virtualMachines/extensions")]
    [InlineData("Microsoft.Compute/virtualMachineScaleSets/extensions")]
    [InlineData("Microsoft.HybridCompute/machines/extensions")]
    [InlineData("Microsoft.Maintenance/maintenanceConfigurations")]
    [InlineData("Microsoft.Maintenance/configurationAssignments")]
    [InlineData("Microsoft.Example/widgets/extensions")]
    public void ShouldOmitFromInventory_returns_true_for_omitted_types(string resourceType)
    {
        AzureInventoryNeverShowArmTypes.ShouldOmitFromInventory(resourceType).Should().BeTrue();
    }

    [Theory]
    [InlineData("Microsoft.Network/virtualNetworks")]
    [InlineData("Microsoft.Compute/virtualMachines")]
    [InlineData("Microsoft.Storage/storageAccounts")]
    [InlineData(null)]
    [InlineData("")]
    public void ShouldOmitFromInventory_returns_false_for_visible_inventory_types(string? resourceType)
    {
        AzureInventoryNeverShowArmTypes.ShouldOmitFromInventory(resourceType).Should().BeFalse();
    }
}
