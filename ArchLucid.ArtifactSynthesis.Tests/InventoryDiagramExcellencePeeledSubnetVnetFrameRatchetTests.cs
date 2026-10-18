using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Graphviz;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramExcellencePeeledSubnetVnetFrameRatchetTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();
    private readonly DiagramForestLayoutSvgRenderer forestRenderer = new();
    private readonly DiagramAstGraphvizDotEmitter dotEmitter = new();

    [Fact]
    public void InventoryDiagramExcellence_full_subscription_after_subnet_peel_places_vms_in_one_vnet_frame()
    {
        GraphSnapshot filtered = InventoryDiagramExcellencePeeledSubnetGraphFixture.PeelSubnetsFrom(
            InventoryDiagramExcellencePeeledSubnetGraphFixture.BuildDualSubnetPeelGraph());

        DiagramAst ast = compiler.Compile(filtered, DiagramMode.FullSubscription);
        DiagramForestLayoutResult layout = forestRenderer.Render(ast);
        layout.Succeeded.Should().BeTrue(layout.Error);

        XDocument svg = XDocument.Parse(layout.Svg!);
        svg.Descendants().Count(element => element.Attribute("class")?.Value == "vnet-frame").Should().Be(1);
        svg.Descendants().Count(element => element.Attribute("class")?.Value == "subnet-frame").Should().Be(0);
    }

    [Fact]
    public void InventoryDiagramExcellence_full_subscription_peeled_subnet_draws_vnet_frame_without_subnet_cards_and_dot_parity()
    {
        GraphSnapshot filtered = InventoryDiagramExcellencePeeledSubnetGraphFixture.PeelSubnetsFrom(
            InventoryDiagramExcellencePeeledSubnetGraphFixture.BuildSameGroupVmSubnetGraph());
        DiagramAst ast = compiler.Compile(filtered, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node =>
            (node.ArmResourceType ?? string.Empty).Contains("/subnets", StringComparison.OrdinalIgnoreCase));
        ast.Edges.Should().Contain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventoryHiddenSubnetVnetPlacement);

        DiagramForestLayoutResult layout = forestRenderer.Render(ast);
        layout.Succeeded.Should().BeTrue(layout.Error);

        XDocument svg = XDocument.Parse(layout.Svg!);
        svg.Descendants().Count(element => element.Attribute("class")?.Value == "vnet-frame").Should().Be(1);
        svg.Descendants().Count(element => element.Attribute("class")?.Value == "subnet-frame").Should().Be(0);
        svg.Descendants().Any(element => element.Attribute("id")?.Value == "node-vnet").Should().BeFalse();

        string dot = dotEmitter.Emit(ast);
        InventoryDiagramExcellenceRatchetAssertions.AssertForestAndDotNestedFrameParity(layout.Svg!, dot);
    }
}
