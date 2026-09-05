using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DiagramAstFromGraphCompilerTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();
    private readonly MermaidDiagramRenderer renderer = new();

    [Fact]
    public void Compile_identical_graph_produces_identical_mermaid_text()
    {
        GraphSnapshot graph = BuildSampleGraph();

        string first = renderer.Render(compiler.Compile(graph, DiagramMode.FullSubscription));
        string second = renderer.Render(compiler.Compile(graph, DiagramMode.FullSubscription));

        first.Should().Be(second);
        first.Should().Contain("flowchart TD");
    }

    [Fact]
    public void Compile_resource_group_filter_limits_nodes_to_target_group()
    {
        GraphSnapshot graph = BuildSampleGraph();

        DiagramAst ast = compiler.Compile(
            graph,
            DiagramMode.ResourceGroup,
            new DiagramAstCompileOptions { ResourceGroupName = "network-rg" });

        ast.Nodes.Should().HaveCount(2);
        ast.Nodes.Select(node => node.NodeId).Should().BeEquivalentTo([
            Renderers.MermaidIdSanitizer.Sanitize("vnet-1"),
            Renderers.MermaidIdSanitizer.Sanitize("subnet-1"),
        ]);
    }

    [Fact]
    public void Compile_executive_mode_is_smaller_than_full_subscription_on_large_fixture()
    {
        GraphSnapshot graph = BuildLargeInventoryGraph(resourceCount: 50);

        DiagramAst executive = compiler.Compile(graph, DiagramMode.Executive);
        DiagramAst full = compiler.Compile(graph, DiagramMode.FullSubscription);

        executive.Nodes.Count.Should().BeLessThan(full.Nodes.Count);
        full.Nodes.Should().HaveCount(50);
        executive.Nodes.Count.Should().BeLessThanOrEqualTo(DiagramAstFromGraphCompilerConstants.ExecutiveMaxResourceNodes);
    }

    [Fact]
    public void Compile_full_subscription_assigns_subgraphs_and_sanitized_node_ids()
    {
        GraphSnapshot graph = BuildSampleGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Subgraphs.Should().NotBeEmpty();
        ast.Nodes.Should().OnlyContain(node => !node.NodeId.Contains('/', StringComparison.Ordinal));
        string mermaid = renderer.Render(ast);
        mermaid.Should().Contain("subgraph");
    }

    [Fact]
    public void Compile_drops_edges_below_documented_weight_threshold()
    {
        GraphSnapshot graph = BuildSampleGraph();
        graph.Edges.Add(new GraphEdge
        {
            EdgeId = "noisy-edge",
            FromNodeId = "vm-1",
            ToNodeId = "storage-1",
            EdgeType = GraphEdgeTypes.RelatesTo,
            Label = "noise",
            Weight = 0.2d,
            InferenceSource = "heuristic",
        });

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Edges.Should().NotContain(edge => edge.Label == "noise");
    }

    private static GraphSnapshot BuildSampleGraph()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";

        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        graph.Nodes.Add(CreateTopologyNode(
            "vnet-1",
            "core-vnet",
            "Microsoft.Network/virtualNetworks",
            "network-rg",
            subscriptionId,
            GraphTopologyCategories.Network));
        graph.Nodes.Add(CreateTopologyNode(
            "subnet-1",
            "app-subnet",
            "Microsoft.Network/virtualNetworks/subnets",
            "network-rg",
            subscriptionId,
            GraphTopologyCategories.Network,
            parentArmId: "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/network-rg/providers/Microsoft.Network/virtualNetworks/core-vnet"));
        graph.Nodes.Add(CreateTopologyNode(
            "vm-1",
            "app-vm",
            "Microsoft.Compute/virtualMachines",
            "compute-rg",
            subscriptionId,
            GraphTopologyCategories.Compute));
        graph.Nodes.Add(CreateTopologyNode(
            "storage-1",
            "logs",
            "Microsoft.Storage/storageAccounts",
            "data-rg",
            subscriptionId,
            GraphTopologyCategories.Storage));

        graph.Edges.Add(new GraphEdge
        {
            EdgeId = "contains-vnet-subnet",
            FromNodeId = "vnet-1",
            ToNodeId = "subnet-1",
            EdgeType = GraphEdgeTypes.Contains,
            Label = "contains",
            Weight = 1d,
        });
        graph.Edges.Add(new GraphEdge
        {
            EdgeId = "vm-storage",
            FromNodeId = "vm-1",
            ToNodeId = "storage-1",
            EdgeType = GraphEdgeTypes.DependsOn,
            Label = "depends",
            Weight = 1d,
        });

        return graph;
    }

    private static GraphSnapshot BuildLargeInventoryGraph(int resourceCount)
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        const string subscriptionId = "22222222-2222-2222-2222-222222222222";

        for (int index = 0; index < resourceCount; index++)
        {
            string resourceGroup = index < 5 ? "rg-summary" : $"rg-{index % 10}";
            string category = (index % 5) switch
            {
                0 => GraphTopologyCategories.Network,
                1 => GraphTopologyCategories.Compute,
                2 => GraphTopologyCategories.Storage,
                3 => GraphTopologyCategories.Data,
                _ => GraphTopologyCategories.Identity,
            };
            string resourceType = category switch
            {
                _ when category == GraphTopologyCategories.Network => "Microsoft.Network/virtualNetworks",
                _ when category == GraphTopologyCategories.Compute => "Microsoft.Compute/virtualMachines",
                _ when category == GraphTopologyCategories.Storage => "Microsoft.Storage/storageAccounts",
                _ when category == GraphTopologyCategories.Data => "Microsoft.Sql/servers",
                _ => "Microsoft.ManagedIdentity/userAssignedIdentities",
            };

            graph.Nodes.Add(CreateTopologyNode(
                $"node-{index}",
                $"resource-{index}",
                resourceType,
                resourceGroup,
                subscriptionId,
                category));
        }

        return graph;
    }

    private static GraphNode CreateTopologyNode(
        string nodeId,
        string label,
        string armType,
        string resourceGroup,
        string subscriptionId,
        string category,
        string? parentArmId = null)
    {
        string armId =
            $"/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/{armType}/{label}";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["arm.id"] = armId,
            ["arm.type"] = armType,
            ["arm.resourceGroup"] = resourceGroup,
            ["arm.subscriptionId"] = subscriptionId,
            ["arm.region"] = "eastus",
        };

        if (!string.IsNullOrWhiteSpace(parentArmId))
        {
            properties["arm.parentId"] = parentArmId;
        }

        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            Category = category,
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
            Properties = properties,
        };
    }
}
