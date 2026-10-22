using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramExcellenceForestRatchetTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();
    private readonly DiagramForestLayoutSvgRenderer renderer = new();

    private static readonly DiagramMode[] RatchetModeValues =
        Enum.GetValues<DiagramMode>()
            .Where(mode => mode is not DiagramMode.Avd and not DiagramMode.BusinessContinuity)
            .ToArray();

    public static TheoryData<DiagramMode> RatchetModes { get; } = new(RatchetModeValues);

    public static TheoryData<DiagramMode> PrivateEndpointHiddenByDefaultModes { get; } = new(
        RatchetModeValues
            .Where(mode => mode is not DiagramMode.DataFlow and not DiagramMode.DataArchitecture)
            .ToArray());

    [Theory]
    [MemberData(nameof(PrivateEndpointHiddenByDefaultModes))]
    public void Default_compile_hides_private_endpoint_cards(DiagramMode mode)
    {
        GraphSnapshot graph = InventoryDiagramExcellenceSharedGraphFixture.BuildFatGraph();
        DiagramAst ast = Compile(graph, mode, includePrivateEndpointNodes: false);

        ast.Nodes.Should().NotContain(node =>
            (node.ArmResourceType ?? string.Empty).Equals(
                "Microsoft.Network/privateEndpoints",
                StringComparison.OrdinalIgnoreCase),
            because: mode.ToString());
    }

    public static TheoryData<DiagramMode> NicHiddenByDefaultModes { get; } = new(
        RatchetModeValues
            .Where(mode => mode is not DiagramMode.Network
                and not DiagramMode.ResourceGroup
                and not DiagramMode.SelectedResources
                and not DiagramMode.DependencyNeighborhood)
            .ToArray());

    [Theory]
    [MemberData(nameof(NicHiddenByDefaultModes))]
    public void Default_compile_hides_nic_cards(DiagramMode mode)
    {
        GraphSnapshot graph = InventoryDiagramExcellenceSharedGraphFixture.BuildFatGraph();
        DiagramAst ast = Compile(graph, mode, includePrivateEndpointNodes: false);

        ast.Nodes.Should().NotContain(node =>
            (node.ArmResourceType ?? string.Empty).Contains(
                "networkInterfaces",
                StringComparison.OrdinalIgnoreCase),
            because: mode.ToString());
    }

    [Fact]
    public void Neighborhood_node_count_is_smaller_than_full_subscription_on_fat_fixture()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceSharedGraphFixture.BuildFatGraph();
        DiagramAst neighborhood = Compile(
            graph,
            DiagramMode.DependencyNeighborhood,
            includePrivateEndpointNodes: false,
            neighborhoodSeedNodeId: "vm-1");
        DiagramAst full = Compile(graph, DiagramMode.FullSubscription, includePrivateEndpointNodes: false);

        neighborhood.Nodes.Count.Should().BeLessThan(full.Nodes.Count);
    }

    [Fact]
    public void Network_render_draws_vnet_frame()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceSharedGraphFixture.BuildFatGraph();
        DiagramAst ast = Compile(graph, DiagramMode.Network, includePrivateEndpointNodes: false);
        string svg = RenderSvg(ast);

        svg.Should().Contain("vnet-frame");
    }

    [Fact]
    public void Identity_render_draws_no_vnet_frame()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceSharedGraphFixture.BuildFatGraph();
        DiagramAst ast = Compile(graph, DiagramMode.Identity, includePrivateEndpointNodes: false);
        string svg = RenderSvg(ast);

        XDocument.Parse(svg)
            .Descendants()
            .Count(element => element.Attribute("class")?.Value == "vnet-frame")
            .Should()
            .Be(0);
    }

    [Fact]
    public void Full_subscription_render_draws_subscription_outer_frame()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceSharedGraphFixture.BuildFatGraph();
        DiagramAst ast = Compile(graph, DiagramMode.FullSubscription, includePrivateEndpointNodes: false);
        string svg = RenderSvg(ast);

        svg.Should().Contain("sub-frame");
    }

    [Fact]
    public void Resource_group_render_omits_subscription_outer_frame()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceSharedGraphFixture.BuildFatGraph();
        DiagramAst ast = Compile(
            graph,
            DiagramMode.ResourceGroup,
            includePrivateEndpointNodes: false,
            resourceGroupName: "network-rg");
        string svg = RenderSvg(ast);

        svg.Should().NotContain("class=\"sub-frame");
    }

    [Fact]
    public void Opt_in_private_endpoints_surfaces_pe_on_network_mode()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceSharedGraphFixture.BuildFatGraph();
        DiagramAst ast = Compile(graph, DiagramMode.Network, includePrivateEndpointNodes: true);

        ast.Nodes.Should().Contain(node =>
            (node.ArmResourceType ?? string.Empty).Equals(
                "Microsoft.Network/privateEndpoints",
                StringComparison.OrdinalIgnoreCase));
    }

    private DiagramAst Compile(
        GraphSnapshot graph,
        DiagramMode mode,
        bool includePrivateEndpointNodes,
        string? neighborhoodSeedNodeId = null,
        string? resourceGroupName = null)
    {
        DiagramAstCompileOptions options = new()
        {
            IncludePrivateEndpointNodes = includePrivateEndpointNodes,
            ResourceGroupName = resourceGroupName ?? (mode == DiagramMode.ResourceGroup ? "network-rg" : null),
            NeighborhoodSeedNodeId = neighborhoodSeedNodeId
                ?? (mode == DiagramMode.DependencyNeighborhood ? "vm-1" : null),
            SelectedNodeIds = mode == DiagramMode.SelectedResources ? ["vm-1"] : null,
        };

        return compiler.Compile(graph, mode, options);
    }

    private string RenderSvg(DiagramAst ast)
    {
        DiagramForestLayoutResult result = renderer.Render(ast);
        result.Succeeded.Should().BeTrue(result.Error);
        return result.Svg!;
    }
}
