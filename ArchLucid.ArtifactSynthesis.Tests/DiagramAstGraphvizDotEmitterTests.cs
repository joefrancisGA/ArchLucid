using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Graphviz;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Diagrams;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramAstGraphvizDotEmitterTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();
    private readonly DiagramAstGraphvizDotEmitter emitter = new();

    [Fact]
    public void Emit_owner_shape_executive_vnets_produces_eleven_nodes_and_six_edges_without_layout_only()
    {
        GraphSnapshot graph = DiagramSparseComponentPackerTests.BuildExecutiveOwnerShapePeeringGraph();
        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);
        string dot = emitter.Emit(ast);

        ast.Nodes.Should().HaveCount(11);
        DiagramEdgeVisibility.CountVisible(ast.Edges).Should().Be(6);

        CountNodeLabelStatements(dot).Should().Be(11);
        CountOccurrences(dot, "->").Should().Be(6);
        CountOccurrences(dot, "label=\"peering\"").Should().Be(6);
        dot.Should().NotContain("alpack_");
        dot.Should().NotContain("~~~");
        dot.Should().Contain("digraph Inventory");
        dot.Should().Contain("layout=fdp");
        dot.Should().Contain("sep=\"+36,28\"");
        dot.Should().Contain("K=1.8");
        dot.Should().Contain("pack=true");
        dot.Should().Contain($"fillcolor=\"{ArchitectureDiagramMermaidPalette.LightNodeFill}\"");
        dot.Should().Contain($"color=\"{ArchitectureDiagramMermaidPalette.LightNodeBorder}\"");
    }

    [Fact]
    public void Emit_escapes_quotes_spaces_and_hyphens_in_labels()
    {
        DiagramAst ast = new()
        {
            Title = "escape-test",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "node/with spaces",
                    Label = "vnet-eastus-1 \"prod\"",
                    NodeType = "vnet",
                },
            ],
        };

        string dot = emitter.Emit(ast);

        dot.Should().Contain("label=");
        dot.Should().NotContain("~~~");
        dot.Should().NotContain("node/with spaces");
        dot.Should().Contain("vnet-eastus-1");
        dot.Should().Contain("'prod'");
    }

    [Fact]
    public void Emit_uses_named_vnet_clusters_for_cited_same_group_members()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (FullSubscription)",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vnet",
                    Label = "vnet-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Network/virtualNetworks",
                    ArmResourceGroup = "rg-app",
                },
                new DiagramNode
                {
                    NodeId = "vm",
                    Label = "vm-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app",
                },
                new DiagramNode
                {
                    NodeId = "vault",
                    Label = "vault-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.KeyVault/vaults",
                    ArmResourceGroup = "rg-app",
                },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "vm",
                    ToNodeId = "vnet",
                    Label = "in",
                    InferenceSource = GraphEdgeInferenceSources.InventoryLayoutVmVnet,
                },
            ],
        };

        string dot = emitter.Emit(ast);

        dot.Should().Contain("subgraph cluster_vnet_vnet");
        dot.Should().Contain("label=\"vnet-app\"");
        dot.Should().NotContain("VNet / subnet");
        dot.Should().Contain("vault");
    }

    [Fact]
    public void Emit_declared_edge_uses_dashed_style()
    {
        DiagramAst ast = new()
        {
            Title = "declared-edge",
            Nodes =
            [
                new DiagramNode { NodeId = "app", Label = "app", NodeType = "app" },
                new DiagramNode { NodeId = "sql", Label = "sql", NodeType = "sql" },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "app",
                    ToNodeId = "sql",
                    Label = "declared · connects",
                    ProvenanceKind = "HumanAssertion",
                    InferenceSource = GraphEdgeInferenceSources.HumanDeclaredConnection,
                },
            ],
        };

        string dot = emitter.Emit(ast);

        dot.Should().Contain("style=dashed");
        dot.Should().Contain("declared · connects");
    }

    [Fact]
    public void Emit_ai_inferred_edge_uses_dotted_style()
    {
        DiagramAst ast = new()
        {
            Title = "inferred-edge",
            Nodes =
            [
                new DiagramNode { NodeId = "app", Label = "app", NodeType = "app" },
                new DiagramNode { NodeId = "sql", Label = "sql", NodeType = "sql" },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "app",
                    ToNodeId = "sql",
                    Label = "inferred · connects",
                    ProvenanceKind = "AiInference",
                },
            ],
        };

        string dot = emitter.Emit(ast);

        dot.Should().Contain("style=dotted");
        dot.Should().Contain("inferred · connects");
    }

    [Fact]
    public void Emit_skips_packing_subgraphs_and_emits_region_clusters()
    {
        DiagramAst ast = new()
        {
            Title = "regions",
            Nodes =
            [
                new DiagramNode { NodeId = "vnet-a", Label = "vnet-a", NodeType = "vnet", SubgraphId = "region-eastus" },
                new DiagramNode { NodeId = "vnet-b", Label = "vnet-b", NodeType = "vnet", SubgraphId = "alpack_0" },
            ],
            Subgraphs =
            [
                new DiagramSubgraph { SubgraphId = "region-eastus", Label = "Region eastus", OrderKey = 0 },
                new DiagramSubgraph { SubgraphId = "alpack_0", Label = "pack", OrderKey = 1 },
            ],
            Edges =
            [
                new DiagramEdge { FromNodeId = "vnet-a", ToNodeId = "vnet-b", Label = "peering" },
            ],
        };

        string dot = emitter.Emit(ast);

        dot.Should().Contain("subgraph cluster_region_eastus");
        dot.Should().Contain("Region eastus");
        dot.Should().Contain("labelloc=t");
        dot.Should().Contain("labeljust=l");
        dot.Should().Contain("margin=\"18,12\"");
        dot.Should().NotContain("alpack_");
        dot.Should().NotContain("cluster_alpack");
    }

    [Fact]
    public void Emit_omits_empty_region_clusters_when_nodes_are_in_resource_group_frames()
    {
        DiagramAst ast = new()
        {
            Title = "rg-over-region",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vnet-a",
                    Label = "vnet-a",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Network/virtualNetworks",
                    ArmResourceGroup = "rg-a",
                    SubgraphId = "region-eastus",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "vnet-b",
                    Label = "vnet-b",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Network/virtualNetworks",
                    ArmResourceGroup = "rg-b",
                    SubgraphId = "region-eastus",
                    OrderKey = 1,
                },
            ],
            Subgraphs =
            [
                new DiagramSubgraph { SubgraphId = "region-eastus", Label = "Region eastus", OrderKey = 0 },
            ],
        };

        string dot = emitter.Emit(ast);

        CountOccurrences(dot, "subgraph cluster_rg_").Should().Be(2);
        dot.Should().NotContain("cluster_region_eastus");
        CountNodeLabelStatements(dot).Should().Be(2);
    }

    [Fact]
    public void Emit_empty_ast_and_single_node_remain_valid_dot()
    {
        DiagramAst empty = new() { Title = "empty" };
        string emptyDot = emitter.Emit(empty);

        emptyDot.Should().Contain("digraph Inventory");
        emptyDot.Should().NotContain("->");

        DiagramAst single = new()
        {
            Title = "single",
            Nodes = [new DiagramNode { NodeId = "only", Label = "only", NodeType = "vnet" }],
        };

        string singleDot = emitter.Emit(single);

        singleDot.Should().Contain("label=");
        singleDot.Should().NotContain("->");
    }

    [Fact]
    public void Emit_resource_group_cluster_uses_two_pixel_solid_stroke()
    {
        DiagramAst ast = new()
        {
            Title = "rg-cluster",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vm-1",
                    Label = "vm-a",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "vm-2",
                    Label = "vm-b",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app",
                    OrderKey = 1,
                },
            ],
            Edges =
            [
                new DiagramEdge { FromNodeId = "vm-1", ToNodeId = "vm-2", Label = "connects" },
            ],
        };

        string dot = emitter.Emit(ast);

        dot.Should().Contain("subgraph cluster_rg_c0");
        dot.Should().Contain($"color=\"{ArchitectureDiagramMermaidPalette.LightResourceGroupFrameStroke}\"");
        dot.Should().Contain("penwidth=2");
        dot.Should().Contain("style=\"rounded,filled\"");
        CountNodeLabelStatements(dot).Should().Be(2);
    }

    [Fact]
    public void Emit_named_singleton_resource_group_emits_one_cluster()
    {
        DiagramAst ast = new()
        {
            Title = "singleton-rg",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vm-1",
                    Label = "vm-a",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app",
                    OrderKey = 0,
                },
            ],
        };

        string dot = emitter.Emit(ast);

        CountOccurrences(dot, "subgraph cluster_").Should().Be(1);
        dot.Should().Contain("subgraph cluster_rg_c0");
        dot.Should().Contain("label=\"rg-app\"");
        CountNodeLabelStatements(dot).Should().Be(1);
    }

    [Fact]
    public void Emit_split_resource_group_in_two_components_emits_one_cluster()
    {
        DiagramAst ast = new()
        {
            Title = "split-rg",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vm-a1",
                    Label = "vm-a1",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "vm-a2",
                    Label = "vm-a2",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app",
                    OrderKey = 1,
                },
                new DiagramNode
                {
                    NodeId = "vm-b1",
                    Label = "vm-b1",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app",
                    OrderKey = 2,
                },
                new DiagramNode
                {
                    NodeId = "vm-b2",
                    Label = "vm-b2",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app",
                    OrderKey = 3,
                },
            ],
            Edges =
            [
                new DiagramEdge { FromNodeId = "vm-a1", ToNodeId = "vm-a2", Label = "connects" },
                new DiagramEdge { FromNodeId = "vm-b1", ToNodeId = "vm-b2", Label = "connects" },
            ],
        };

        string dot = emitter.Emit(ast);

        CountOccurrences(dot, "subgraph cluster_").Should().Be(1);
        dot.Should().Contain("subgraph cluster_rg_c0");
        CountOccurrences(dot, "penwidth=2").Should().BeGreaterThanOrEqualTo(1);
        CountNodeLabelStatements(dot).Should().Be(4);
    }

    [Fact]
    public void Emit_owner_shape_golden_has_six_arrows_and_eleven_labels()
    {
        GraphSnapshot graph = DiagramSparseComponentPackerTests.BuildExecutiveOwnerShapePeeringGraph();
        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);
        string dot = emitter.Emit(ast);

        foreach (string label in new[]
                 {
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
                 })
        {
            dot.Should().Contain(label);
        }

        CountOccurrences(dot, "->").Should().Be(6);
        CountNodeLabelStatements(dot).Should().Be(11);
    }

    private static int CountNodeLabelStatements(string dot)
    {
        return dot
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Count(line => line.Contains("[label=", StringComparison.Ordinal) && !line.Contains("->", StringComparison.Ordinal));
    }

    private static int CountOccurrences(string source, string token)
    {
        int count = 0;
        int index = 0;

        while ((index = source.IndexOf(token, index, StringComparison.Ordinal)) >= 0)
        {
            count++;
            index += token.Length;
        }

        return count;
    }
}
