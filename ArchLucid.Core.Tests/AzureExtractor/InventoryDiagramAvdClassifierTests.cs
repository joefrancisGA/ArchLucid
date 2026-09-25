using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramAvdClassifierTests
{
    [Theory]
    [InlineData("Microsoft.DesktopVirtualization/hostPools", InventoryDiagramAvdCategory.HostPool)]
    [InlineData("Microsoft.DesktopVirtualization/applicationGroups", InventoryDiagramAvdCategory.ApplicationGroup)]
    [InlineData("Microsoft.DesktopVirtualization/workspaces", InventoryDiagramAvdCategory.Workspace)]
    [InlineData("Microsoft.DesktopVirtualization/scalingPlans", InventoryDiagramAvdCategory.ScalingPlan)]
    public void TryClassify_maps_desktop_virtualization_arm_types(
        string armType,
        InventoryDiagramAvdCategory expectedCategory)
    {
        bool classified = InventoryDiagramAvdClassifier.TryClassify(
            armType,
            "/subscriptions/sub/resourceGroups/rg/providers/" + armType + "/name",
            out InventoryDiagramAvdCategory category);

        classified.Should().BeTrue();
        category.Should().Be(expectedCategory);
    }

    [Fact]
    public void TryClassify_maps_session_host_child_resource()
    {
        const string sessionHostArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DesktopVirtualization/hostPools/pool/sessionHosts/host1";

        InventoryDiagramAvdClassifier.TryClassify(
                "Microsoft.DesktopVirtualization/hostPools/sessionHosts",
                sessionHostArmId,
                out InventoryDiagramAvdCategory category)
            .Should()
            .BeTrue();

        category.Should().Be(InventoryDiagramAvdCategory.SessionHost);
    }

    [Fact]
    public void TryReadHostPoolArmId_returns_parent_host_pool_for_session_host()
    {
        const string sessionHostArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DesktopVirtualization/hostPools/pool/sessionHosts/host1";

        InventoryDiagramAvdClassifier.TryReadHostPoolArmId(sessionHostArmId)
            .Should()
            .BeEquivalentTo("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DesktopVirtualization/hostPools/pool");
    }

    [Fact]
    public void TryReadHostPoolArmId_returns_host_pool_for_host_pool_resource()
    {
        const string hostPoolArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DesktopVirtualization/hostPools/pool";

        InventoryDiagramAvdClassifier.TryReadHostPoolArmId(hostPoolArmId)
            .Should()
            .BeEquivalentTo(hostPoolArmId);
    }
}
