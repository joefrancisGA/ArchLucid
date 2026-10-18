using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Testing;
using ArchLucid.ArtifactSynthesis.Graphviz;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("InventoryDiagramExcellence", "DataFlowHubPipeline")]
public sealed class InventoryDiagramExcellenceDataFlowHubPipelineCompileRatchetTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();
    private readonly DiagramForestLayoutSvgRenderer forestRenderer = new();
    private readonly DiagramAstGraphvizDotEmitter dotEmitter = new();
    private readonly MermaidDiagramRenderPipeline mermaidPipeline = new(
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
    public async Task InventoryDiagramExcellence_data_flow_hub_pipeline_compile_matches_excellence_contract()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.Build();
        DiagramAst ast = compiler.Compile(graph, DiagramMode.DataFlow);

        InventoryDiagramExcellenceRatchetAssertions.AssertDataFlowRetainsStageSubgraphs(ast);
        ast.Nodes.Should().HaveCountGreaterThanOrEqualTo(14);

        foreach (string graphNodeId in InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.AllGraphNodeIds())
        {
            string diagramNodeId = MermaidIdSanitizer.Sanitize(graphNodeId);
            ast.Nodes.Should().Contain(node => node.NodeId == diagramNodeId, graphNodeId);
        }

        DiagramForestDataFlowRollup.Result rollup = DiagramForestDataFlowRollup.Apply(ast.Nodes, ast.Edges);
        rollup.Nodes.Should().NotContain(node => node.IsDataFlowRollup);

        DiagramForestLayoutResult forest = forestRenderer.Render(ast);
        forest.Succeeded.Should().BeTrue(forest.Error);
        XDocument svg = XDocument.Parse(forest.Svg!);

        svg.Descendants()
            .Count(element => element.Attribute("data-hub-spoke")?.Value == "hub")
            .Should()
            .Be(1);

        InventoryDiagramExcellenceRatchetAssertions.AssertRoleColumnMarkersAbsent(forest.Svg!, DiagramMode.DataFlow);

        string landingNodeId = MermaidIdSanitizer.Sanitize(InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.LandingGraphNodeId);
        string factoryNodeId = MermaidIdSanitizer.Sanitize(InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.FactoryGraphNodeId);
        IReadOnlyList<string> spokeNodeIds = InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.SpokeGraphNodeIds()
            .Select(MermaidIdSanitizer.Sanitize)
            .ToList();

        InventoryDiagramExcellenceDataFlowHubRoutingAssertions.AssertCrossStageRouteAvoidsSpokeCards(
            ast,
            svg,
            landingNodeId,
            factoryNodeId,
            spokeNodeIds);

        MermaidDiagramRenderResult mermaid = await mermaidPipeline.RenderAsync(new MermaidDiagramRenderRequest { Ast = ast });
        mermaid.Status.Should().Be(MermaidDiagramRenderStatus.Succeeded);
        string mermaidText = mermaid.PrimaryMermaid!;

        foreach (string graphNodeId in InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.AllGraphNodeIds())
        {
            mermaidText.Should().Contain(MermaidIdSanitizer.Sanitize(graphNodeId));
        }

        ast.Edges.Should().Contain(edge =>
            edge.FromNodeId == MermaidIdSanitizer.Sanitize(InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.LandingGraphNodeId)
            && edge.ToNodeId == MermaidIdSanitizer.Sanitize(InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.FactoryGraphNodeId));

        AssertMermaidDirectedEdge(
            mermaidText,
            InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.LandingGraphNodeId,
            InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.FactoryGraphNodeId);
        AssertMermaidDirectedEdge(mermaidText, InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.FactoryGraphNodeId, "st0");
        AssertMermaidDirectedEdge(mermaidText, InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.FactoryGraphNodeId, "st11");

        InventoryDiagramExcellenceDataFlowHubPipelineExportStageLabelAssertions.AssertAll(mermaidText, svg);

        string dot = dotEmitter.Emit(ast);
        InventoryDiagramExcellenceDataFlowHubPipelineCompiledDotAssertions.AssertHubPipelineDot(dot);
        InventoryDiagramExcellenceDataFlowHubPipelineCompiledDotAssertions.AssertHubPipelineDotUsesStableStageClusterIds(dot);
    }

    private static void AssertMermaidDirectedEdge(string mermaid, string fromNodeId, string toNodeId)
    {
        string from = MermaidIdSanitizer.Sanitize(fromNodeId);
        string to = MermaidIdSanitizer.Sanitize(toNodeId);

        bool found = mermaid
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Any(line =>
                line.StartsWith(from, StringComparison.Ordinal)
                && line.Contains(to, StringComparison.Ordinal)
                && (line.Contains("-->", StringComparison.Ordinal) || line.Contains("-.->", StringComparison.Ordinal)));

        found.Should().BeTrue($"expected Mermaid edge {from} → {to}");
    }

}
