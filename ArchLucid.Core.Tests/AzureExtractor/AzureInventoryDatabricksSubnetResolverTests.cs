using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryDatabricksSubnetResolverTests
{
    [Fact]
    public void TryResolvePrivateSubnetId_builds_subnet_arm_id()
    {
        const string vnetId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1";
        const string subnetName = "private-subnet";

        string? subnetId = AzureInventoryDatabricksSubnetResolver.TryResolvePrivateSubnetId(vnetId, subnetName);

        subnetId.Should().Be($"{vnetId}/subnets/{subnetName}");
    }

    [Theory]
    [InlineData(null, "subnet")]
    [InlineData("/subscriptions/sub/.../virtualNetworks/vnet1", null)]
    [InlineData("  ", "subnet")]
    public void TryResolvePrivateSubnetId_returns_null_when_inputs_missing(string? vnetId, string? subnetName)
    {
        AzureInventoryDatabricksSubnetResolver.TryResolvePrivateSubnetId(vnetId, subnetName).Should().BeNull();
    }
}
