using ArchLucid.KnowledgeGraph.Inventory;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests.Inventory;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryDataFlowStageResolverTests
{
    [Theory]
    [InlineData("Microsoft.DataFactory/factories", AzureInventoryDataFlowStageNames.Ingestion)]
    [InlineData("Microsoft.Sql/servers", AzureInventoryDataFlowStageNames.Storage)]
    [InlineData("Microsoft.Storage/storageAccounts", AzureInventoryDataFlowStageNames.Storage)]
    [InlineData("Microsoft.DocumentDB/databaseAccounts", AzureInventoryDataFlowStageNames.Storage)]
    [InlineData("Microsoft.Synapse/workspaces", AzureInventoryDataFlowStageNames.Transform)]
    [InlineData("Microsoft.Databricks/workspaces", AzureInventoryDataFlowStageNames.Transform)]
    [InlineData("Microsoft.Network/virtualNetworks", null)]
    [InlineData("Microsoft.Compute/virtualMachines", null)]
    public void Resolve_maps_arm_types_to_stages(string armType, string? expectedStage)
    {
        AzureInventoryDataFlowStageResolver.Resolve(armType, isExternalSource: false)
            .Should()
            .Be(expectedStage);
    }

    [Fact]
    public void Resolve_external_source_flag_returns_source_even_when_arm_type_empty()
    {
        AzureInventoryDataFlowStageResolver.Resolve(string.Empty, isExternalSource: true)
            .Should()
            .Be(AzureInventoryDataFlowStageNames.Source);
    }
}
