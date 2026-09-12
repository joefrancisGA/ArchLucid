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
    public void Pack_owner_shape_executive_vnets_with_six_peerings_wraps_components_and_emits_grid_links()
    {
        GraphSnapshot graph = BuildExecutiveOwnerShapePeeringGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);
        string mermaid = renderer.Render(ast);

        DiagramEdgeVisibility.CountVisible(ast.Edges).Should().Be(6);
        ast.Subgraphs.Should().OnlyContain(subgraph => DiagramSparseComponentPacker.IsPackingSubgraph(subgraph));
        ast.Subgraphs.Count.Should().Be(5);
        mermaid.Should().Contain("~~~");
        mermaid.Should().Contain("-->|\"peered\"|");
        mermaid.Should().Contain("subgraph alpack_");
        mermaid.Should().Contain("style alpack_0 fill:transparent,stroke:none");
    }

    [Fact]
    public void Pack_zero_edge_eleven_vnets_does_not_add_packing_subgraphs()
    {
        GraphSnapshot graph = BuildExecutiveSparseVnetGraph(resourceGroupCount: 11);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);

        ast.Subgraphs.Should().BeEmpty();
        ast.Edges.Should().OnlyContain(edge => edge.IsLayoutOnly);
    }

    [Fact]
    public void Pack_single_connected_graph_does_not_add_packing_subgraphs()
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
        ast.Subgraphs.Should().NotContain(subgraph => DiagramSparseComponentPacker.IsPackingSubgraph(subgraph));
        renderer.Render(ast).Should().NotContain("~~~");
    }

    private static GraphSnapshot BuildExecutiveOwnerShapePeeringGraph()
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
            (6, 4),
            (1, 9),
            (3, 5),
            (8, 10),
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
