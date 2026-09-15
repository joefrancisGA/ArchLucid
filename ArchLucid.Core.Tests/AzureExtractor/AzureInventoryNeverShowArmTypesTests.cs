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
    [InlineData("Microsoft.OperationalInsights/workspaces")]
    [InlineData("Microsoft.OperationsManagement/solutions")]
    [InlineData("microsoft.operationsmanagement/solutions")]
    [InlineData("solutions")]
    [InlineData("Microsoft.Network/dnszones")]
    [InlineData("Microsoft.Network/privateDnsZones")]
    [InlineData("Microsoft.Network/dnsResolvers")]
    [InlineData("Microsoft.Network/firewallPolicies")]
    [InlineData("microsoft.network/firewallpolicies")]
    [InlineData("firewallpolicies")]
    [InlineData("Microsoft.ManagedIdentity/userAssignedIdentities")]
    [InlineData("microsoft.managedidentity/userassignedidentities")]
    [InlineData("userassignedidentities")]
    [InlineData("Microsoft.Automation/automationAccounts/runbooks")]
    [InlineData("microsoft.automation/automationaccounts/runbooks")]
    [InlineData("runbooks")]
    [InlineData("Microsoft.Compute/virtualMachines/extensions/versions")]
    [InlineData("Microsoft.Automation/automationAccounts/runbooks/versions")]
    [InlineData("versions")]
    [InlineData("Microsoft.Compute/virtualMachines/extensions")]
    [InlineData("Microsoft.Compute/virtualMachineScaleSets/extensions")]
    [InlineData("Microsoft.Compute/sshPublicKeys")]
    [InlineData("microsoft.compute/sshpublickeys")]
    [InlineData("sshpublickeys")]
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

    [Theory]
    [InlineData("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateDnsZones/zone1/virtualNetworkLinks/link1")]
    [InlineData("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationsManagement/solutions/Security")]
    [InlineData("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationsManagement/solutions/Containers")]
    [InlineData("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/log1")]
    [InlineData("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/sshPublicKeys/vm-ssh-key")]
    [InlineData("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/firewallPolicies/fwp1")]
    [InlineData("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/uai1")]
    [InlineData("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Automation/automationAccounts/aa1/runbooks/rb1")]
    [InlineData("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1/extensions/ext1/versions/1.0")]
    public void ShouldOmitAzureResourceId_returns_true_for_never_show_arm_ids(string azureResourceId)
    {
        AzureInventoryNeverShowArmTypes.ShouldOmitAzureResourceId(azureResourceId).Should().BeTrue();
    }

    [Theory]
    [InlineData("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1")]
    [InlineData("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1")]
    [InlineData("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1")]
    [InlineData(null)]
    [InlineData("")]
    public void ShouldOmitAzureResourceId_returns_false_for_visible_arm_ids(string? azureResourceId)
    {
        AzureInventoryNeverShowArmTypes.ShouldOmitAzureResourceId(azureResourceId).Should().BeFalse();
    }

    [Fact]
    public void ShouldOmitResource_uses_arm_id_when_resource_type_is_missing()
    {
        AzureInventoryNeverShowArmTypes.ShouldOmitResource(
                null,
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationsManagement/solutions/Security")
            .Should()
            .BeTrue();

        AzureInventoryNeverShowArmTypes.ShouldOmitResource(
                string.Empty,
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateDnsZones/zone1/virtualNetworkLinks/link1")
            .Should()
            .BeTrue();
    }
}
