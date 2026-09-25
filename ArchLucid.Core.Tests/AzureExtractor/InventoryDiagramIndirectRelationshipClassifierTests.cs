using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramIndirectRelationshipClassifierTests
{
    [Theory]
    [InlineData("Microsoft.KeyVault/vaults", InventoryDiagramIndirectRelationshipCategory.KeyVault)]
    [InlineData("Microsoft.Storage/storageAccounts", InventoryDiagramIndirectRelationshipCategory.StorageAccount)]
    [InlineData("Microsoft.ContainerRegistry/registries", InventoryDiagramIndirectRelationshipCategory.Registry)]
    [InlineData("Microsoft.Compute/virtualMachines", InventoryDiagramIndirectRelationshipCategory.VirtualMachine)]
    [InlineData("Microsoft.Cache/redis", InventoryDiagramIndirectRelationshipCategory.RedisCache)]
    public void TryClassify_maps_supported_arm_types(
        string armType,
        InventoryDiagramIndirectRelationshipCategory expectedCategory)
    {
        bool classified = InventoryDiagramIndirectRelationshipClassifier.TryClassify(
            armType,
            out InventoryDiagramIndirectRelationshipCategory category);

        classified.Should().BeTrue();
        category.Should().Be(expectedCategory);
    }

    [Fact]
    public void TryClassify_returns_false_for_unrelated_arm_type()
    {
        InventoryDiagramIndirectRelationshipClassifier.TryClassify(
                "Microsoft.Network/routeTables",
                out _)
            .Should()
            .BeFalse();
    }
}
