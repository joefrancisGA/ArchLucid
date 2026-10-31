using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Testing;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph.Inventory;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramDataFlowEffectiveStageResolverTests
{
    [Fact]
    public void BuildStageOverrides_places_adf_reads_source_and_factory_without_forcing_sinks_to_ingestion()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.Build();

        IReadOnlyDictionary<string, string> overrides =
            DiagramDataFlowEffectiveStageResolver.BuildStageOverrides(graph.Nodes, graph.Edges);

        overrides[InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.LandingGraphNodeId]
            .Should()
            .Be(AzureInventoryDataFlowStageNames.Source);
        overrides[InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.FactoryGraphNodeId]
            .Should()
            .Be(AzureInventoryDataFlowStageNames.Ingestion);

        overrides.Should().NotContainKey("st0");
    }
}
