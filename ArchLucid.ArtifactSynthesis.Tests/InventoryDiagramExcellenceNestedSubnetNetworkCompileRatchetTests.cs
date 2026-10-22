using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Graphviz;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramExcellenceNestedSubnetNetworkCompileRatchetTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();
    private readonly DiagramForestLayoutSvgRenderer forestRenderer = new();
    private readonly DiagramAstGraphvizDotEmitter dotEmitter = new();

    [Fact]
    public void InventoryDiagramExcellence_network_compile_dual_subnet_fixture_draws_subnet_frames_and_dot_parity()
    {
        DiagramAst ast = compiler.Compile(
            InventoryDiagramExcellenceNestedSubnetGraphFixture.Build(),
            DiagramMode.Network,
            new DiagramAstCompileOptions());

        ast.Nodes.Should().Contain(node =>
            (node.ArmResourceType ?? string.Empty).Contains("/subnets", StringComparison.OrdinalIgnoreCase));
        ast.Edges.Should().Contain(edge =>
            ast.Nodes.Any(node =>
                string.Equals(node.NodeId, edge.ToNodeId, StringComparison.Ordinal)
                && (node.ArmResourceType ?? string.Empty).Contains("/subnets", StringComparison.OrdinalIgnoreCase)),
            "compiled AST should retain VM→subnet placement edges");

        DiagramForestLayoutResult layout = forestRenderer.Render(ast);
        layout.Succeeded.Should().BeTrue(layout.Error);
        string dot = dotEmitter.Emit(ast);

        XDocument svg = XDocument.Parse(layout.Svg!);
        svg.Descendants().Count(element => element.Attribute("class")?.Value == "subnet-frame").Should().Be(2);
        InventoryDiagramExcellenceRatchetAssertions.AssertForestAndDotNestedFrameParity(layout.Svg!, dot);
    }

    [Fact]
    public void InventoryDiagramExcellence_network_compile_fat_fixture_keeps_subnet_frames_when_placement_survives()
    {
        DiagramAst ast = compiler.Compile(
            InventoryDiagramExcellenceSharedGraphFixture.BuildFatGraph(),
            DiagramMode.Network,
            new DiagramAstCompileOptions());

        ast.Nodes.Should().Contain(node => (node.ArmResourceType ?? string.Empty).Contains("virtualMachines"));
        ast.Nodes.Should().Contain(node => (node.ArmResourceType ?? string.Empty).Contains("/subnets"));
        ast.Edges.Should().Contain(edge =>
            ast.Nodes.Any(node =>
                string.Equals(node.NodeId, edge.ToNodeId, StringComparison.Ordinal)
                && (node.ArmResourceType ?? string.Empty).Contains("/subnets", StringComparison.OrdinalIgnoreCase)));

        DiagramForestLayoutResult layout = forestRenderer.Render(ast);
        layout.Succeeded.Should().BeTrue(layout.Error);
        XDocument.Parse(layout.Svg!)
            .Descendants()
            .Count(element => element.Attribute("class")?.Value == "subnet-frame")
            .Should()
            .BeGreaterThan(0);
    }
}
