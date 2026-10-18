using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Graphviz;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramExcellenceFatGraphForestDotParityRatchetTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();
    private readonly DiagramForestLayoutSvgRenderer forestRenderer = new();
    private readonly DiagramAstGraphvizDotEmitter dotEmitter = new();

    [Fact]
    public void InventoryDiagramExcellence_network_fat_graph_forest_dot_nested_frame_parity()
    {
        (string svg, string dot) = CompileRenderAndEmit(DiagramMode.Network, resourceGroupName: null);

        XDocument.Parse(svg)
            .Descendants()
            .Count(element => element.Attribute("class")?.Value == "subnet-frame")
            .Should()
            .BeGreaterThan(0);

        InventoryDiagramExcellenceRatchetAssertions.AssertForestAndDotNestedFrameParity(svg, dot);
    }

    [Fact]
    public void InventoryDiagramExcellence_full_subscription_fat_graph_forest_dot_nested_frame_parity()
    {
        (string svg, string dot) = CompileRenderAndEmit(DiagramMode.FullSubscription, resourceGroupName: null);

        InventoryDiagramExcellenceRatchetAssertions.AssertForestAndDotNestedFrameParity(svg, dot);
    }

    [Fact]
    public void InventoryDiagramExcellence_resource_group_fat_graph_forest_dot_nested_frame_parity()
    {
        (string svg, string dot) = CompileRenderAndEmit(
            DiagramMode.ResourceGroup,
            resourceGroupName: "network-rg");

        InventoryDiagramExcellenceRatchetAssertions.AssertForestAndDotNestedFrameParity(svg, dot);
    }

    private (string Svg, string Dot) CompileRenderAndEmit(DiagramMode mode, string? resourceGroupName)
    {
        GraphSnapshot graph = InventoryDiagramExcellenceSharedGraphFixture.BuildFatGraph();
        DiagramAstCompileOptions options = new()
        {
            ResourceGroupName = resourceGroupName,
            NeighborhoodSeedNodeId = null,
            SelectedNodeIds = null,
        };

        DiagramAst ast = compiler.Compile(graph, mode, options);
        ast.Nodes.Should().NotBeEmpty($"fat graph should produce nodes for {mode}");

        DiagramForestLayoutResult layout = forestRenderer.Render(ast);
        layout.Succeeded.Should().BeTrue(layout.Error);
        string dot = dotEmitter.Emit(ast);

        return (layout.Svg!, dot);
    }
}
