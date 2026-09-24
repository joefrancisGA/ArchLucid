using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>
/// Mode rows use a hand-built <see cref="DiagramAst"/> because these cases only need the nodes a mode would leave visible.
/// </summary>
public sealed class DiagramForestVnetFrameModeTests
{
    private readonly DiagramForestLayoutSvgRenderer renderer = new();

    [Theory]
    [InlineData(DiagramMode.Network)]
    [InlineData(DiagramMode.FullSubscription)]
    [InlineData(DiagramMode.ResourceGroup)]
    public void Render_network_modes_box_a_cited_same_group_vm(DiagramMode mode)
    {
        XDocument svg = Render(mode, "vm", "Microsoft.Compute/virtualMachines");
        svg.Descendants().Count(element => element.Attribute("class")?.Value == "vnet-frame").Should().Be(1, mode.ToString());
    }

    [Fact]
    public void Render_identity_mode_draws_no_vnet_frame()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (Identity)",
            Nodes =
            [
                Node("user", "user", "Microsoft.AAD/users", "rg-id"),
            ],
        };

        RenderSvg(ast).Descendants().Count(element => element.Attribute("class")?.Value == "vnet-frame").Should().Be(0, "Identity");
    }

    [Fact]
    public void Render_data_mode_skips_compute_only_vnet_and_boxes_storage()
    {
        XDocument computeOnly = Render(DiagramMode.Data, "vm", "Microsoft.Compute/virtualMachines");
        computeOnly.Descendants().Count(element => element.Attribute("class")?.Value == "vnet-frame").Should().Be(0, "Data");

        XDocument storage = Render(DiagramMode.Data, "storage", "Microsoft.Storage/storageAccounts");
        storage.Descendants().Count(element => element.Attribute("class")?.Value == "vnet-frame").Should().Be(1, "Data");
    }

    [Fact]
    public void Render_data_flow_keeps_stage_subgraph_ids()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (DataFlow)",
            Subgraphs =
            [
                new DiagramSubgraph { SubgraphId = "stage-source", Label = "Source" },
                new DiagramSubgraph { SubgraphId = "stage-sink", Label = "Sink" },
            ],
            Nodes =
            [
                Node("storage", "storage", "Microsoft.Storage/storageAccounts", "rg-data", "stage-source"),
                Node("sql", "sql", "Microsoft.Sql/servers/databases", "rg-data", "stage-sink"),
            ],
            Edges =
            [
                new DiagramEdge { FromNodeId = "storage", ToNodeId = "sql", Label = "writes" },
            ],
        };

        IReadOnlyList<string> before = ast.Subgraphs.Select(subgraph => subgraph.SubgraphId).ToList();
        XDocument svg = RenderSvg(ast);
        ast.Subgraphs.Select(subgraph => subgraph.SubgraphId).Should().Equal(before, "DataFlow");
        svg.Descendants().Any(element => element.Attribute("class")?.Value == "data-flow-stage-labels").Should().BeTrue("DataFlow");
    }

    [Fact]
    public void Render_dependency_neighborhood_boxes_only_the_visible_vnet()
    {
        XDocument svg = Render(DiagramMode.DependencyNeighborhood, "vm", "Microsoft.Compute/virtualMachines");
        svg.Descendants().Count(element => element.Attribute("class")?.Value == "vnet-frame").Should().Be(1, "DependencyNeighborhood");
        svg.ToString().Should().NotContain("outside-vnet");
    }

    private XDocument Render(DiagramMode mode, string workloadId, string armType)
    {
        return RenderSvg(new DiagramAst
        {
            Title = $"Azure inventory ({mode})",
            Nodes =
            [
                Node("vnet", "app-vnet", "Microsoft.Network/virtualNetworks", "rg-app"),
                Node(workloadId, workloadId, armType, "rg-app"),
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = workloadId,
                    ToNodeId = "vnet",
                    Label = "in",
                    InferenceSource = GraphEdgeInferenceSources.InventoryLayoutVmVnet,
                },
            ],
        });
    }

    private XDocument RenderSvg(DiagramAst ast)
    {
        DiagramForestLayoutResult result = renderer.Render(ast);
        result.Succeeded.Should().BeTrue(result.Error);
        return XDocument.Parse(result.Svg!);
    }

    private static DiagramNode Node(
        string nodeId,
        string label,
        string armType,
        string resourceGroup,
        string? subgraphId = null)
    {
        return new DiagramNode
        {
            NodeId = nodeId,
            Label = label,
            NodeType = "TopologyResource",
            ArmResourceType = armType,
            ArmResourceId = $"/subscriptions/s/resourceGroups/{resourceGroup}/providers/{armType}/{nodeId}",
            ArmResourceGroup = resourceGroup,
            SubgraphId = subgraphId,
        };
    }
}
