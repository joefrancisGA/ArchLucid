using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramSparseComponentPackerTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();
    private readonly MermaidDiagramRenderer renderer = new();

    [Fact]
    public void Pack_owner_shape_executive_vnets_emits_row_links_without_packing_subgraphs()
    {
        GraphSnapshot graph = BuildExecutiveOwnerShapePeeringGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);
        string mermaid = renderer.Render(ast);

        ast.Nodes.Should().HaveCount(11);
        DiagramEdgeVisibility.CountVisible(ast.Edges).Should().Be(6);
        ast.Subgraphs.Should().BeEmpty();
        ast.Edges.Count(edge => edge.IsLayoutOnly).Should().BeGreaterThanOrEqualTo(2);
        mermaid.Should().Contain("~~~");
        mermaid.Should().Contain("-->");
        mermaid.Should().NotContain("subgraph alpack");
        mermaid.Should().NotContain("style alpack_");
        mermaid.Should().NotContain("classDef alpack");
        mermaid.Should().Contain("vnet-eastus-1");

        DiagramNode eastusOne = ast.Nodes.Single(node => node.Label.Contains("vnet-eastus-1", StringComparison.Ordinal));
        ast.Edges.Should().Contain(edge =>
            edge.IsLayoutOnly && string.Equals(edge.FromNodeId, eastusOne.NodeId, StringComparison.Ordinal));
    }

    [Fact]
    public void Pack_zero_edge_eleven_vnets_does_not_add_packing_subgraphs()
    {
        GraphSnapshot graph = BuildExecutiveSparseVnetGraph(resourceGroupCount: 11);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);

        ast.Subgraphs.Should().BeEmpty();
        ast.Edges.Should().OnlyContain(edge => edge.IsLayoutOnly);
        renderer.Render(ast).Should().NotContain("subgraph alpack");
    }

    [Fact]
    public void Pack_single_connected_graph_does_not_add_row_planner_links()
    {
        GraphSnapshot graph = BuildExecutiveSparseVnetGraph(resourceGroupCount: 11);

        for (int index = 0; index < graph.Nodes.Count - 1; index++)
        {
            graph.Edges.Add(new GraphEdge
            {
                EdgeId = $"chain-{index}",
                FromNodeId = graph.Nodes[index].NodeId,
                ToNodeId = graph.Nodes[index + 1].NodeId,
                EdgeType = GraphEdgeTypes.PeersWith,
                Weight = 1,
            });
        }

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);

        DiagramEdgeVisibility.CountVisible(ast.Edges).Should().Be(10);
        ast.Subgraphs.Should().BeEmpty();
        renderer.Render(ast).Should().NotContain("~~~");
        renderer.Render(ast).Should().NotContain("subgraph alpack");
    }

    [Fact]
    public void Pack_region_swimlanes_align_inside_region_and_does_not_wrap_over_frames()
    {
        GraphSnapshot graph = BuildExecutiveTwoRegionPeeringForest();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);
        string mermaid = renderer.Render(ast);

        ast.Subgraphs.Should().HaveCount(2);
        ast.Subgraphs.Should().OnlyContain(subgraph => subgraph.Label.StartsWith("Region ", StringComparison.Ordinal));
        ast.Nodes.Should().OnlyContain(node => !string.IsNullOrWhiteSpace(node.SubgraphId));
        DiagramEdgeVisibility.CountVisible(ast.Edges).Should().Be(4);
        ast.Edges.Should().Contain(edge => edge.IsLayoutOnly);
        mermaid.Should().Contain("Region eastus");
        mermaid.Should().Contain("Region westus");
        mermaid.Should().NotContain("subgraph alpack");
        mermaid.Should().Contain("~~~");
    }

    internal static GraphSnapshot BuildExecutiveOwnerShapePeeringGraph()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        const string subscriptionId = "bebca1aa-9fba-408a-b9ce-2794678c4281";

        string[] labels =
        [
            "vnet-aep-hi-test-wus-001",
            "vnet-avd-hi-nonprod01",
            "vnet-avd-hi-nprd",
            "vnet-eastus",
            "vnet-eastus-1",
            "vnet-edw-hi-dev",
            "vnet-edw-hi-nprd-wus-001",
            "vnet-edw-hi-ppd",
            "vnet-edw-hi-tst",
            "vnet-pcoe-hi-nprd",
            "vnet-userprovision-hi-nonprod01",
        ];

        for (int index = 0; index < labels.Length; index++)
        {
            graph.Nodes.Add(CreateTopologyNode(
                $"vnet-{index}",
                labels[index],
                "Microsoft.Network/virtualNetworks",
                $"network-rg-{index}",
                subscriptionId,
                GraphTopologyCategories.Network));
        }

        (int from, int to)[] peerings =
        [
            (0, 6),
            (2, 7),
            (1, 8),
            (3, 9),
            (5, 10),
            (6, 4),
        ];

        for (int index = 0; index < peerings.Length; index++)
        {
            (int from, int to) = peerings[index];
            graph.Edges.Add(new GraphEdge
            {
                EdgeId = $"peering-{index}",
                FromNodeId = graph.Nodes[from].NodeId,
                ToNodeId = graph.Nodes[to].NodeId,
                EdgeType = GraphEdgeTypes.PeersWith,
                Weight = 1,
            });
        }

        return graph;
    }

    private static GraphSnapshot BuildExecutiveTwoRegionPeeringForest()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        const string subscriptionId = "55555555-5555-5555-5555-555555555555";

        graph.Nodes.Add(CreateRegionVnet("east-a", "vnet-east-hub", "network-rg-east-a", subscriptionId, "eastus"));
        graph.Nodes.Add(CreateRegionVnet("east-b", "vnet-east-spoke", "network-rg-east-b", subscriptionId, "eastus"));
        graph.Nodes.Add(CreateRegionVnet("east-c", "vnet-east-dev", "network-rg-east-c", subscriptionId, "eastus"));
        graph.Nodes.Add(CreateRegionVnet("east-d", "vnet-east-tst", "network-rg-east-d", subscriptionId, "eastus"));
        graph.Nodes.Add(CreateRegionVnet("east-e", "vnet-east-ppd", "network-rg-east-e", subscriptionId, "eastus"));
        graph.Nodes.Add(CreateRegionVnet("east-f", "vnet-east-nprd", "network-rg-east-f", subscriptionId, "eastus"));
        graph.Nodes.Add(CreateRegionVnet("west-a", "vnet-west-hub", "network-rg-west-a", subscriptionId, "westus"));
        graph.Nodes.Add(CreateRegionVnet("west-b", "vnet-west-spoke", "network-rg-west-b", subscriptionId, "westus"));

        graph.Edges.Add(CreatePeering("peering-east-hub-spoke", "east-a", "east-b"));
        graph.Edges.Add(CreatePeering("peering-east-dev-tst", "east-c", "east-d"));
        graph.Edges.Add(CreatePeering("peering-east-ppd-nprd", "east-e", "east-f"));
        graph.Edges.Add(CreatePeering("peering-west", "west-a", "west-b"));

        return graph;
    }

    private static GraphSnapshot BuildExecutiveSparseVnetGraph(int resourceGroupCount)
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        const string subscriptionId = "33333333-3333-3333-3333-333333333333";

        for (int index = 0; index < resourceGroupCount; index++)
        {
            graph.Nodes.Add(CreateTopologyNode(
                $"vnet-{index}",
                $"vnet-eastus-{index}",
                "Microsoft.Network/virtualNetworks",
                $"network-rg-{index}",
                subscriptionId,
                GraphTopologyCategories.Network));
        }

        return graph;
    }

    private static GraphNode CreateRegionVnet(
        string nodeId,
        string label,
        string resourceGroup,
        string subscriptionId,
        string location)
    {
        GraphNode node = CreateTopologyNode(
            nodeId,
            label,
            "Microsoft.Network/virtualNetworks",
            resourceGroup,
            subscriptionId,
            GraphTopologyCategories.Network);
        node.Properties["arm.location"] = location;

        return node;
    }

    private static GraphEdge CreatePeering(string edgeId, string fromNodeId, string toNodeId)
    {
        return new GraphEdge
        {
            EdgeId = edgeId,
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = GraphEdgeTypes.PeersWith,
            Weight = 1,
        };
    }

    private static GraphNode CreateTopologyNode(
        string nodeId,
        string label,
        string armType,
        string resourceGroup,
        string subscriptionId,
        string category)
    {
        string armId =
            $"/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/{armType}/{label}";

        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
            Category = category,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = armId,
                ["arm.type"] = armType,
                ["arm.resourceGroup"] = resourceGroup,
                ["arm.subscriptionId"] = subscriptionId,
            },
        };
    }
}
