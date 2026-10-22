using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryDataFlowStageResolverTests
{
    [Theory]
    [InlineData("Microsoft.Databricks/workspaces", AzureInventoryDataFlowStage.Transform)]
    [InlineData("Microsoft.Databricks/accessConnectors/connector", AzureInventoryDataFlowStage.Transform)]
    [InlineData("Microsoft.PowerBIDedicated/capacities", AzureInventoryDataFlowStage.Consumer)]
    [InlineData("Microsoft.Fabric/capacities", AzureInventoryDataFlowStage.Consumer)]
    public void Resolve_maps_known_analytics_types(string resourceType, AzureInventoryDataFlowStage expected)
    {
        AzureInventoryDataFlowStageResolver.Resolve(resourceType).Should().Be(expected);
    }

    [Fact]
    public void Resolve_returns_null_for_unmapped_compute_types()
    {
        AzureInventoryDataFlowStageResolver.Resolve("Microsoft.Compute/virtualMachines").Should().BeNull();
    }

    [Fact]
    public void Resolve_marks_external_sources_when_requested()
    {
        AzureInventoryDataFlowStageResolver.Resolve("Custom.External/source", isExternalSource: true)
            .Should()
            .Be(AzureInventoryDataFlowStage.Source);
    }
}
