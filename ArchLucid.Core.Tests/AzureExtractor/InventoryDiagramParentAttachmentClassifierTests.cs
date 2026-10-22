using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramParentAttachmentClassifierTests
{
    [Theory]
    [InlineData("Microsoft.Network/publicIPAddresses", InventoryDiagramParentAttachmentCategory.PublicIp)]
    [InlineData("Microsoft.ServiceBus/namespaces/queues", InventoryDiagramParentAttachmentCategory.NamespaceChild)]
    [InlineData("Microsoft.Compute/restorePointCollections", InventoryDiagramParentAttachmentCategory.RestorePointCollection)]
    [InlineData("Microsoft.VirtualMachineImages/imageTemplates", InventoryDiagramParentAttachmentCategory.ImageTemplate)]
    public void TryClassify_maps_known_child_arm_types(
        string armType,
        InventoryDiagramParentAttachmentCategory expectedCategory)
    {
        InventoryDiagramParentAttachmentClassifier.TryClassify(armType, out InventoryDiagramParentAttachmentCategory category)
            .Should()
            .BeTrue();
        category.Should().Be(expectedCategory);
    }

    [Fact]
    public void TryClassify_returns_false_for_unrelated_arm_type()
    {
        InventoryDiagramParentAttachmentClassifier.TryClassify(
                "Microsoft.Storage/storageAccounts",
                out _)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsValidParentArmType_rejects_resource_group_collocation_without_cited_parent_type()
    {
        InventoryDiagramParentAttachmentClassifier.IsValidParentArmType(
                InventoryDiagramParentAttachmentCategory.RestorePointCollection,
                "Microsoft.Compute/disks")
            .Should()
            .BeFalse();
    }
}
