using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("InventoryDiagramExcellence", "DataFlowHubPipeline")]
public sealed class InventoryDiagramExcellenceDataFlowHubPipelineMermaidRatchetTests
{
    private readonly MermaidDiagramRenderPipeline pipeline = new(
        new MermaidDiagramRenderer(),
        new MermaidDiagramComplexityAnalyzer(),
        new MermaidDiagramDeterministicRepairer(),
        new MermaidDiagramStructuralValidator(),
        new MermaidDiagramSemanticIntegrityGuard(),
        new MermaidDiagramFallbackSetBuilder(
            new DiagramAstFromGraphCompiler(),
            new MermaidDiagramRenderer(),
            new MermaidDiagramComplexityAnalyzer(),
            new MermaidDiagramDeterministicRepairer(),
            new MermaidDiagramStructuralValidator(),
            new DiagramPeelCatalogDefaultProvider()));

    [Fact]
    public async Task InventoryDiagramExcellence_data_flow_hub_pipeline_mermaid_retains_nodes_and_cited_edges()
    {
        DiagramAst ast = InventoryDiagramExcellenceDataFlowHubPipelineFixture.Build();
        InventoryDiagramExcellenceRatchetAssertions.AssertDataFlowRetainsStageSubgraphs(ast);

        MermaidDiagramRenderResult result = await pipeline.RenderAsync(new MermaidDiagramRenderRequest { Ast = ast });

        result.Status.Should().Be(MermaidDiagramRenderStatus.Succeeded);
        result.PrimaryMermaid.Should().NotBeNullOrWhiteSpace();

        string mermaid = result.PrimaryMermaid!;

        foreach (string nodeId in InventoryDiagramExcellenceDataFlowHubPipelineFixture.AllRenderableNodeIds())
        {
            mermaid.Should().Contain(nodeId, $"Mermaid export must retain node {nodeId}");
        }

        AssertDirectedEdge(mermaid, InventoryDiagramExcellenceDataFlowHubPipelineFixture.LandingNodeId, InventoryDiagramExcellenceDataFlowHubPipelineFixture.FactoryNodeId);
        AssertDirectedEdge(mermaid, InventoryDiagramExcellenceDataFlowHubPipelineFixture.FactoryNodeId, "st0");
        AssertDirectedEdge(mermaid, InventoryDiagramExcellenceDataFlowHubPipelineFixture.FactoryNodeId, "st11");

        // Paired Source/Ingestion stage copy: InventoryDiagramExcellenceDataFlowHubPipelineHandExportStageLabelRatchetTests (IDX-13q).
    }

    private static void AssertDirectedEdge(string mermaid, string fromNodeId, string toNodeId)
    {
        bool found = mermaid
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Any(line =>
                line.StartsWith(fromNodeId, StringComparison.Ordinal)
                && line.Contains(toNodeId, StringComparison.Ordinal)
                && (line.Contains("-->", StringComparison.Ordinal) || line.Contains("-.->", StringComparison.Ordinal)));

        found.Should().BeTrue($"expected a cited Mermaid edge {fromNodeId} → {toNodeId}");
    }
}
