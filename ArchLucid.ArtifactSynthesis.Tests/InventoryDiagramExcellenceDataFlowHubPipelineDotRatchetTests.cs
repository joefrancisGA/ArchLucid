using ArchLucid.ArtifactSynthesis.Graphviz;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("InventoryDiagramExcellence", "DataFlowHubPipeline")]
public sealed class InventoryDiagramExcellenceDataFlowHubPipelineDotRatchetTests
{
    private readonly DiagramAstGraphvizDotEmitter emitter = new();

    [Fact]
    public void InventoryDiagramExcellence_data_flow_hub_pipeline_dot_retains_nodes_stages_and_cited_edges()
    {
        DiagramAst ast = InventoryDiagramExcellenceDataFlowHubPipelineFixture.Build();
        InventoryDiagramExcellenceRatchetAssertions.AssertDataFlowRetainsStageSubgraphs(ast);

        string dot = emitter.Emit(ast);

        dot.Should().NotBeNullOrWhiteSpace();

        foreach (string nodeId in InventoryDiagramExcellenceDataFlowHubPipelineFixture.AllRenderableNodeIds())
        {
            string quotedId = GraphvizIdEscaper.QuoteIdentifier(MermaidIdSanitizer.Sanitize(nodeId));
            dot.Should().Contain(quotedId, $"DOT export must retain node {nodeId}");
        }

        dot.Should().Contain("cluster_stage_source", "Data Flow source stage should compile to a DOT cluster");
        dot.Should().Contain("cluster_stage_transform", "Data Flow transform stage should compile to a DOT cluster");
        dot.Should().Contain("label=\"Source\"");
        dot.Should().Contain("label=\"Ingestion\"");

        AssertDirectedEdge(dot, InventoryDiagramExcellenceDataFlowHubPipelineFixture.LandingNodeId, InventoryDiagramExcellenceDataFlowHubPipelineFixture.FactoryNodeId);
        AssertDirectedEdge(dot, InventoryDiagramExcellenceDataFlowHubPipelineFixture.FactoryNodeId, "st0");
        AssertDirectedEdge(dot, InventoryDiagramExcellenceDataFlowHubPipelineFixture.FactoryNodeId, "st11");
    }

    private static void AssertDirectedEdge(string dot, string fromNodeId, string toNodeId)
    {
        string fromQuoted = GraphvizIdEscaper.QuoteIdentifier(MermaidIdSanitizer.Sanitize(fromNodeId));
        string toQuoted = GraphvizIdEscaper.QuoteIdentifier(MermaidIdSanitizer.Sanitize(toNodeId));

        bool found = dot
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Any(line =>
                line.Contains(fromQuoted, StringComparison.Ordinal)
                && line.Contains(toQuoted, StringComparison.Ordinal)
                && line.Contains("->", StringComparison.Ordinal));

        found.Should().BeTrue($"expected a cited DOT edge {fromNodeId} → {toNodeId}");
    }
}
