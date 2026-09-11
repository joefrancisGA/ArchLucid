using ArchLucid.KnowledgeGraph.Inventory;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests.Inventory;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryTopologyCategoryTests
{
    [Theory]
    [InlineData("Microsoft.Network/virtualNetworks", GraphTopologyCategories.Network)]
    [InlineData("Microsoft.Network/virtualNetworks/subnets", GraphTopologyCategories.Network)]
    [InlineData("Microsoft.Network/publicIPAddresses", GraphTopologyCategories.Network)]
    [InlineData("Microsoft.Network/loadBalancers", GraphTopologyCategories.Network)]
    [InlineData("Microsoft.Network/privateEndpoints", GraphTopologyCategories.Network)]
    [InlineData("Microsoft.Network/applicationGateways", GraphTopologyCategories.Network)]
    [InlineData("Microsoft.Network/azureFirewalls", GraphTopologyCategories.Network)]
    [InlineData("Microsoft.Network/networkInterfaces", GraphTopologyCategories.Network)]
    [InlineData("Microsoft.Network/networkSecurityGroups", GraphTopologyCategories.Network)]
    [InlineData("Microsoft.Compute/virtualMachines", GraphTopologyCategories.Compute)]
    [InlineData("Microsoft.Storage/storageAccounts", GraphTopologyCategories.Storage)]
    public void Resolve_maps_arm_types_to_topology_categories(string resourceType, string expectedCategory)
    {
        AzureInventoryTopologyCategory.Resolve(resourceType).Should().Be(expectedCategory);
    }

    [Fact]
    public void Resolve_blank_resource_type_defaults_to_compute()
    {
        AzureInventoryTopologyCategory.Resolve(null).Should().Be(GraphTopologyCategories.Compute);
        AzureInventoryTopologyCategory.Resolve("").Should().Be(GraphTopologyCategories.Compute);
        AzureInventoryTopologyCategory.Resolve("   ").Should().Be(GraphTopologyCategories.Compute);
    }

    [Theory]
    [InlineData("Microsoft.Network/virtualNetworks/subnets", true)]
    [InlineData("Microsoft.Network/virtualNetworks", false)]
    [InlineData("Microsoft.Network/publicIPAddresses", false)]
    public void IsSubnetArmType_detects_subnet_resource_types(string armType, bool expected)
    {
        AzureInventoryTopologyCategory.IsSubnetArmType(armType).Should().Be(expected);
    }

    [Theory]
    [InlineData("Microsoft.Network/virtualNetworks", true)]
    [InlineData("Microsoft.Network/virtualNetworks/subnets", false)]
    public void IsVirtualNetworkArmType_detects_vnet_resource_types(string armType, bool expected)
    {
        AzureInventoryTopologyCategory.IsVirtualNetworkArmType(armType).Should().Be(expected);
    }
}
