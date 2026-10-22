using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Testing;
using ArchLucid.Core.Diagrams;
using ArchLucid.KnowledgeGraph.Inventory;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("InventoryDiagramExcellence", "DataFlowHubPipeline")]
public sealed class InventoryDiagramExcellenceDataFlowHubPipelineStageLabelParityTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void InventoryDiagramExcellence_data_flow_hub_hand_fixture_matches_compile_ingestion_stage_label()
    {
        DiagramAst handAst = InventoryDiagramExcellenceDataFlowHubPipelineFixture.Build();
        DiagramAst compiledAst = compiler.Compile(
            InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.Build(),
            DiagramMode.DataFlow);

        string handIngestionLabel = ResolveSecondStageLabel(handAst);
        string compiledIngestionLabel = ResolveSecondStageLabel(compiledAst);

        handIngestionLabel.Should().Be(AzureInventoryDataFlowStageNames.Ingestion);
        compiledIngestionLabel.Should().Be(AzureInventoryDataFlowStageNames.Ingestion);
        handIngestionLabel.Should().Be(compiledIngestionLabel);
    }

    private static string ResolveSecondStageLabel(DiagramAst ast)
    {
        DiagramSubgraph? ingestionStage = ast.Subgraphs
            .OrderBy(subgraph => subgraph.OrderKey)
            .ThenBy(subgraph => subgraph.SubgraphId, StringComparer.Ordinal)
            .Skip(1)
            .FirstOrDefault();

        ingestionStage.Should().NotBeNull("Data Flow hub pipeline must have a second stage subgraph");
        ingestionStage!.Label.Should().NotBeNullOrWhiteSpace();

        return ingestionStage.Label!;
    }
}
