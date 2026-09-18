using ArchLucid.KnowledgeGraph.Inventory;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests.Inventory;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryDataFlowStageResolverTests
{
    [Theory]
    [InlineData("Microsoft.DataFactory/factories", AzureInventoryDataFlowStageNames.Ingestion)]
    [InlineData("Microsoft.Web/sites", AzureInventoryDataFlowStageNames.Application)]
    [InlineData("Microsoft.App/containerApps", AzureInventoryDataFlowStageNames.Application)]
    [InlineData("Microsoft.EventGrid/topics", AzureInventoryDataFlowStageNames.Ingestion)]
    [InlineData("Microsoft.ServiceBus/namespaces/topics", AzureInventoryDataFlowStageNames.Storage)]
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

    [Fact]
    public void OrderedStages_places_application_immediately_after_source()
    {
        int sourceIndex = AzureInventoryDataFlowStageNames.OrderedStages
            .Select((stage, index) => (stage, index))
            .Single(pair => pair.stage == AzureInventoryDataFlowStageNames.Source)
            .index;
        int applicationIndex = AzureInventoryDataFlowStageNames.OrderedStages
            .Select((stage, index) => (stage, index))
            .Single(pair => pair.stage == AzureInventoryDataFlowStageNames.Application)
            .index;

        applicationIndex.Should().Be(sourceIndex + 1);
    }
}
