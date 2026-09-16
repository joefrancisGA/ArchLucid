using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
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
        executive.Nodes.Count.Should().BeLessThanOrEqualTo(DiagramAstFromGraphCompilerConstants.ExecutiveMaxTotalNodes);
        // 10 VNets + 10 VMs + 10 storage accounts + 10 SQL servers; identities are not an always-show tier.
        executive.Nodes.Should().HaveCount(40);
        executive.Nodes.Should().NotContain(node => node.ArmResourceType == "Microsoft.ManagedIdentity/userAssignedIdentities");
    }

    [Fact]
    public void Compile_executive_mode_keeps_every_vnet_including_beyond_former_twelve_cap()
    {
        GraphSnapshot graph = BuildExecutiveSparseVnetGraph(resourceGroupCount: 13);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);

        ast.Nodes.Should().HaveCount(13);
    }

    [Fact]
    public void Compile_executive_mode_synthesizes_peering_from_vnet_property_json()
    {
        GraphSnapshot graph = BuildExecutiveVnetOnlyGraph();
        GraphNode left = graph.Nodes[0];
        GraphNode right = graph.Nodes[1];
        string rightArmId = DiagramAstGraphNodeClassifier.ReadArmId(right);
        left.Properties[AzureInventoryVnetPeeringParser.PeeringsPropertyKey] =
            "[{\"properties\":{\"remoteVirtualNetwork\":{\"id\":\"" + rightArmId + "\"}}}]";

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);
        string mermaid = renderer.Render(ast);

        ast.Edges.Should().Contain(edge => !edge.IsLayoutOnly && edge.Label == "peering");
        mermaid.Should().Contain("-->|\"peering\"|");
    }

    [Fact]
    public void Compile_executive_mode_always_shows_tiers_in_order_and_hides_unchecked_tiers()
    {
        GraphSnapshot graph = BuildExecutiveAlwaysShowGraph(virtualMachineCount: 2, databaseCount: 1, dataFactoryCount: 1);

        DiagramAst allTiers = compiler.Compile(graph, DiagramMode.Executive);
        DiagramAst withoutWorkloads = compiler.Compile(
            graph,
            DiagramMode.Executive,
            new DiagramAstCompileOptions { HiddenExecutiveTierKeys = [ExecutiveAlwaysShowTiers.WorkloadsKey] });

        allTiers.Nodes.Select(node => node.Label).Should().Equal(
            "hub-vnet",
            "vm-0",
            "vm-1",
            "sqldb-0",
            "stcritical",
            "adf-0");
        allTiers.Nodes.Should().OnlyContain(node => !string.IsNullOrWhiteSpace(node.SeedNodeId));
        withoutWorkloads.Nodes.Select(node => node.Label).Should().Equal("hub-vnet", "sqldb-0", "stcritical", "adf-0");
    }

    [Fact]
    public void Compile_executive_mode_rolls_tier_overflow_into_one_summary_node_without_seed()
    {
        int vmCount = DiagramAstFromGraphCompilerConstants.ExecutiveAlwaysShowTierMaxNodes + 5;
        GraphSnapshot graph = BuildExecutiveAlwaysShowGraph(virtualMachineCount: vmCount, databaseCount: 0, dataFactoryCount: 0);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);
        string mermaid = renderer.Render(ast);

        List<DiagramNode> vmNodes = ast.Nodes
            .Where(node => node.ArmResourceType == "Microsoft.Compute/virtualMachines")
            .ToList();
        vmNodes.Should().HaveCount(DiagramAstFromGraphCompilerConstants.ExecutiveAlwaysShowTierMaxNodes);

        DiagramNode overflow = ast.Nodes.Should().ContainSingle(node => node.Label == "+5 more compute workloads").Subject;
        overflow.SeedNodeId.Should().BeNull();
        overflow.ArmResourceType.Should().BeNull();
        overflow.CloudResourceId.Should().BeNull();
        overflow.IsExecutiveOverflow.Should().BeTrue();
        mermaid.Should().Contain("+5 more compute workloads");
        mermaid.Should().NotContain("al-seed=executive-overflow");

        DiagramForestLayoutResult forestLayout = new DiagramForestLayoutSvgRenderer().Render(ast);
        forestLayout.Succeeded.Should().BeTrue();
        forestLayout.Svg.Should().NotContain("+5 more compute workloads");
    }

    [Fact]
    public void Compile_executive_mode_region_frames_include_always_show_resources()
    {
        GraphSnapshot graph = BuildExecutiveMultiRegionVnetGraph();
        GraphNode westVm = CreateTopologyNode(
            "vm-west",
            "vm-westus-app",
            "Microsoft.Compute/virtualMachines",
            "network-rg-west",
            "44444444-4444-4444-4444-444444444444",
            GraphTopologyCategories.Compute);
        westVm.Properties["arm.location"] = "westus";
        graph.Nodes.Add(westVm);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);

        ast.Subgraphs.Should().HaveCount(3);
        ast.Subgraphs.Should().OnlyContain(subgraph => subgraph.Label.StartsWith("Region ", StringComparison.Ordinal));
        DiagramNode vmNode = ast.Nodes.Should().ContainSingle(node => node.Label == "vm-westus-app").Subject;
        string westRegionId = ast.Subgraphs.Should().ContainSingle(subgraph => subgraph.Label == "Region westus").Subject.SubgraphId;
        vmNode.SubgraphId.Should().Be(westRegionId);
        ast.Nodes.Should().OnlyContain(node =>
            node.SubgraphId == null || ast.Subgraphs.Any(subgraph => subgraph.SubgraphId == node.SubgraphId));
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
    public void Compile_dependency_neighborhood_resolves_seed_from_resource_label()
    {
        GraphSnapshot graph = BuildSampleGraph();

        DiagramAst ast = compiler.Compile(
            graph,
            DiagramMode.DependencyNeighborhood,
            new DiagramAstCompileOptions { NeighborhoodSeedNodeId = "core-vnet" });

        ast.Nodes.Select(node => node.Label).Should().BeEquivalentTo(["core-vnet", "app-subnet"]);
        ast.Nodes.Should().Contain(node => node.SeedNodeId == "vnet-1");
        renderer.Render(ast).Should().Contain("al-seed=vnet-1");
    }

    [Fact]
    public void Compile_dependency_neighborhood_resolves_seed_from_arm_id_when_node_id_is_guid()
    {
        Guid cloudResourceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        const string armId =
            "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/network-rg/providers/Microsoft.Network/virtualNetworks/core-vnet";
        GraphSnapshot graph = BuildSampleGraph();
        GraphNode vnet = graph.Nodes.Should().ContainSingle(node => node.NodeId == "vnet-1").Subject;
        vnet.NodeId = cloudResourceId.ToString("D");
        vnet.Properties["cloudResourceId"] = cloudResourceId.ToString("D");
        graph.Edges[0].FromNodeId = vnet.NodeId;

        DiagramAst ast = compiler.Compile(
            graph,
            DiagramMode.DependencyNeighborhood,
            new DiagramAstCompileOptions { NeighborhoodSeedNodeId = armId });

        ast.Nodes.Select(node => node.Label).Should().BeEquivalentTo(["core-vnet", "app-subnet"]);
        ast.Nodes.Should().Contain(node => node.SeedNodeId == cloudResourceId.ToString("D"));
        ast.Nodes.Should().Contain(node => node.CloudResourceId == cloudResourceId);
    }

    [Fact]
    public void Compile_dependency_neighborhood_unknown_seed_returns_no_nodes()
    {
        GraphSnapshot graph = BuildSampleGraph();

        DiagramAst ast = compiler.Compile(
            graph,
            DiagramMode.DependencyNeighborhood,
            new DiagramAstCompileOptions { NeighborhoodSeedNodeId = "missing-resource" });

        ast.Nodes.Should().BeEmpty();
    }

    [Fact]
    public void Compile_executive_mode_without_graph_edges_emits_invisible_grid_links_and_prunes_vnet_shell_subgraphs()
    {
        GraphSnapshot graph = BuildExecutiveVnetOnlyGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);
        string mermaid = renderer.Render(ast);

        ast.Nodes.Should().HaveCount(3);
        ast.Edges.Should().OnlyContain(edge => edge.IsLayoutOnly);
        ast.Subgraphs.Should().NotContain(subgraph => subgraph.Label.StartsWith("VNet ", StringComparison.Ordinal));
        mermaid.Should().NotContain("-->");
        mermaid.Should().Contain("RG network-rg-0");
    }

    [Fact]
    public void Compile_executive_mode_groups_vnets_by_region_and_surfaces_peering_with_counts()
    {
        GraphSnapshot graph = BuildExecutiveMultiRegionVnetGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);
        string mermaid = renderer.Render(ast);

        ast.Nodes.Should().HaveCount(3);
        ast.Subgraphs.Should().HaveCount(3);
        ast.Subgraphs.Should().OnlyContain(subgraph => subgraph.Label.StartsWith("Region ", StringComparison.Ordinal));
        ast.Edges.Should().ContainSingle(edge => !edge.IsLayoutOnly && edge.Label == "peering");
        ast.Nodes.Should().Contain(node => node.Label.Contains("2 subnets", StringComparison.Ordinal));
        mermaid.Should().Contain("-->|\"peering\"|");
        mermaid.Should().Contain("Region eastus");
        mermaid.Should().Contain("Region westus");
        mermaid.Should().Contain("Region northeurope");
    }

    [Fact]
    public void Compile_executive_blank_vnet_edge_types_still_annotate_peering()
    {
        GraphSnapshot graph = DiagramSparseComponentPackerTests.BuildExecutiveOwnerShapePeeringGraph();

        foreach (GraphEdge edge in graph.Edges)
        {
            edge.EdgeType = string.Empty;
            edge.Label = null;
            edge.InferenceSource = null;
        }

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);
        string mermaid = renderer.Render(ast);

        DiagramEdgeVisibility.VisibleEdges(ast.Edges).Should().HaveCount(6);
        DiagramEdgeVisibility.VisibleEdges(ast.Edges).Should().OnlyContain(edge => edge.Label == "peering");
        mermaid.Should().Contain("-->|\"peering\"|");
        mermaid.Should().NotContain("--> ");
    }

    [Fact]
    public void Compile_executive_mode_flattens_sparse_swimlanes_when_many_resource_groups_each_hold_one_node()
    {
        GraphSnapshot graph = BuildExecutiveSparseVnetGraph(resourceGroupCount: 12);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);
        string mermaid = renderer.Render(ast);

        ast.Nodes.Should().HaveCount(12);
        ast.Subgraphs.Should().BeEmpty();
        ast.Nodes.Should().OnlyContain(node => string.IsNullOrWhiteSpace(node.SubgraphId));
        mermaid.Should().NotContain("subgraph");
        mermaid.Should().Contain("vnet-eastus-0");
        mermaid.Should().Contain("vnet-eastus-11");
    }

    [Fact]
    public void Compile_network_mode_flattens_sparse_swimlanes_when_many_resource_groups_each_hold_one_node()
    {
        GraphSnapshot graph = BuildExecutiveSparseVnetGraph(resourceGroupCount: 12);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Network);
        string mermaid = renderer.Render(ast);

        ast.Nodes.Should().HaveCount(12);
        ast.Subgraphs.Should().BeEmpty();
        ast.Nodes.Should().OnlyContain(node => string.IsNullOrWhiteSpace(node.SubgraphId));
        mermaid.Should().NotContain("subgraph");
        mermaid.Should().Contain("vnet-eastus-0");
        mermaid.Should().Contain("vnet-eastus-11");
        mermaid.Should().Contain("flowchart TD");
    }

    [Fact]
    public void Compile_network_mode_includes_microsoft_network_virtual_networks_without_pre_stamped_category()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        graph.Nodes.Add(new GraphNode
        {
            NodeId = "vnet-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "core-vnet",
            SourceType = "azure-inventory-snapshot",
            SourceId =
                "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/network-rg/providers/Microsoft.Network/virtualNetworks/core-vnet",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] =
                    "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/network-rg/providers/Microsoft.Network/virtualNetworks/core-vnet",
                ["arm.type"] = "Microsoft.Network/virtualNetworks",
                ["arm.resourceGroup"] = "network-rg",
                ["arm.subscriptionId"] = "11111111-1111-1111-1111-111111111111",
            },
        });

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Network);

        ast.Nodes.Should().ContainSingle();
        ast.Nodes[0].Label.Should().Be("core-vnet");
    }

    [Fact]
    public void Compile_network_mode_excludes_private_endpoint_nodes_and_access_badges()
    {
        const string peArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-sql";
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/core-vnet";
        const string sqlArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql/databases/app";

        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                BuildNetworkTopologyNode("vnet-1", vnetArmId, "Microsoft.Network/virtualNetworks", "core-vnet"),
                BuildNetworkTopologyNode("pe-1", peArmId, "Microsoft.Network/privateEndpoints", "pe-sql"),
                BuildNetworkTopologyNode("sql-1", sqlArmId, "Microsoft.Sql/servers/databases", "app"),
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "edge-pe-sql",
                    FromNodeId = "pe-1",
                    ToNodeId = "sql-1",
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget,
                    InferenceSource = GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                    Weight = 1.0d,
                },
            ],
        };

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Network);

        ast.Nodes.Should().ContainSingle();
        ast.Nodes[0].Label.Should().Be("core-vnet");
        ast.Nodes.Should().NotContain(node => node.Label == "pe-sql");
        ast.Nodes.Should().OnlyContain(node => !node.HasPrivateEndpointAccess);

        DiagramForestLayoutResult svg = new DiagramForestLayoutSvgRenderer().Render(ast);
        svg.Svg.Should().NotContain("class=\"private-endpoint-lock\"");
        svg.Svg.Should().NotContain("Private endpoint access");
    }

    [Fact]
    public void Compile_full_subscription_excludes_private_endpoint_nodes_and_keeps_access_badges()
    {
        const string peArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-sql";
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/core-vnet";
        const string sqlArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql/databases/app";

        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                BuildNetworkTopologyNode("vnet-1", vnetArmId, "Microsoft.Network/virtualNetworks", "core-vnet"),
                BuildNetworkTopologyNode("pe-1", peArmId, "Microsoft.Network/privateEndpoints", "pe-sql"),
                BuildNetworkTopologyNode("sql-1", sqlArmId, "Microsoft.Sql/servers/databases", "app"),
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "edge-pe-sql",
                    FromNodeId = "pe-1",
                    ToNodeId = "sql-1",
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget,
                    InferenceSource = GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                    Weight = 1.0d,
                },
            ],
        };

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node => node.Label == "pe-sql");
        ast.Nodes.Should().Contain(node => node.Label == "core-vnet");
        ast.Nodes.Single(node => node.Label == "app").HasPrivateEndpointAccess.Should().BeTrue();

        DiagramForestLayoutResult svg = new DiagramForestLayoutSvgRenderer().Render(ast);
        svg.Svg.Should().Contain("class=\"private-endpoint-lock\"");
        svg.Svg.Should().Contain("Private endpoint access");
        svg.Svg.Should().NotContain(">pe-sql<");
    }

    [Fact]
    public void Compile_data_mode_flattens_sparse_swimlanes_when_many_resource_groups_each_hold_one_node()
    {
        GraphSnapshot graph = BuildDataSparseStorageGraph(resourceGroupCount: 12);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Data);
        string mermaid = renderer.Render(ast);

        ast.Nodes.Should().HaveCount(12);
        ast.Subgraphs.Should().BeEmpty();
        ast.Nodes.Should().OnlyContain(node => string.IsNullOrWhiteSpace(node.SubgraphId));
        mermaid.Should().NotContain("subgraph");
        mermaid.Should().Contain("stdata-0");
        mermaid.Should().Contain("stdata-11");
        mermaid.Should().Contain("flowchart TD");
    }

    [Fact]
    public void Compile_data_mode_keeps_resource_group_frames_when_few_swimlanes()
    {
        GraphSnapshot graph = BuildDataSparseStorageGraph(resourceGroupCount: 3);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Data);
        string mermaid = renderer.Render(ast);

        ast.Nodes.Should().HaveCount(3);
        ast.Subgraphs.Should().NotBeEmpty();
        mermaid.Should().Contain("subgraph");
        mermaid.Should().Contain("RG data-rg-0");
        mermaid.Should().Contain("stdata-0");
    }

    [Fact]
    public void Compile_identity_mode_flattens_sparse_swimlanes_when_many_resource_groups_each_hold_one_node()
    {
        GraphSnapshot graph = BuildIdentitySparseManagedIdentityGraph(resourceGroupCount: 12);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Identity);
        string mermaid = renderer.Render(ast);

        ast.Nodes.Should().HaveCount(12);
        ast.Subgraphs.Should().BeEmpty();
        ast.Nodes.Should().OnlyContain(node => string.IsNullOrWhiteSpace(node.SubgraphId));
        mermaid.Should().NotContain("subgraph");
        mermaid.Should().Contain("mi-eastus-0");
        mermaid.Should().Contain("mi-eastus-11");
        mermaid.Should().Contain("flowchart TD");
    }

    [Fact]
    public void Compile_identity_mode_keeps_resource_group_frames_when_few_swimlanes()
    {
        GraphSnapshot graph = BuildIdentitySparseManagedIdentityGraph(resourceGroupCount: 3);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Identity);
        string mermaid = renderer.Render(ast);

        ast.Nodes.Should().HaveCount(3);
        ast.Subgraphs.Should().NotBeEmpty();
        mermaid.Should().Contain("subgraph");
        mermaid.Should().Contain("RG identity-rg-0");
        mermaid.Should().Contain("mi-eastus-0");
    }

    [Fact]
    public void Compile_identity_mode_forest_layout_renders_managed_identity_labels()
    {
        GraphSnapshot graph = BuildIdentitySparseManagedIdentityGraph(resourceGroupCount: 12);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Identity);
        DiagramForestLayoutResult forestLayout = new DiagramForestLayoutSvgRenderer().Render(ast);

        ast.Subgraphs.Should().BeEmpty();
        forestLayout.Succeeded.Should().BeTrue();
        forestLayout.Svg.Should().Contain("mi-eastus-0");
        forestLayout.Svg.Should().Contain("mi-eastus-11");
        forestLayout.Svg.Should().Contain("g class=\"node\"");
    }

    [Fact]
    public void Compile_identity_mode_includes_user_assigned_identities_without_pre_stamped_category()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        graph.Nodes.Add(new GraphNode
        {
            NodeId = "mi-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "app-identity",
            SourceType = "azure-inventory-snapshot",
            SourceId =
                "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/identity-rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/app-identity",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] =
                    "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/identity-rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/app-identity",
                ["arm.type"] = "Microsoft.ManagedIdentity/userAssignedIdentities",
                ["arm.resourceGroup"] = "identity-rg",
                ["arm.subscriptionId"] = "11111111-1111-1111-1111-111111111111",
            },
        });

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Identity);

        ast.Nodes.Should().ContainSingle();
        ast.Nodes[0].Label.Should().Be("app-identity");
    }

    [Fact]
    public void Compile_full_subscription_nests_subnet_under_vnet_subgraph_for_subnet_arm_type()
    {
        GraphSnapshot graph = BuildSampleGraph();
        GraphNode subnetNode = graph.Nodes
            .Should()
            .ContainSingle(node => node.NodeId == "subnet-1")
            .Subject;

        subnetNode.Properties["arm.type"] = "Microsoft.Network/virtualNetworks/subnets";

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);
        string mermaid = renderer.Render(ast);

        ast.Nodes.Should().Contain(node => node.Label == "app-subnet");
        mermaid.Should().Contain("subgraph");
        mermaid.Should().Contain("core-vnet");
    }

    [Fact]
    public void Compile_full_subscription_does_not_flatten_sparse_swimlanes()
    {
        GraphSnapshot graph = BuildDataSparseStorageGraph(resourceGroupCount: 12);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);
        string mermaid = renderer.Render(ast);

        ast.Nodes.Should().HaveCount(12);
        ast.Subgraphs.Should().NotBeEmpty();
        mermaid.Should().Contain("subgraph");
    }

    [Fact]
    public void Compile_collapses_duplicate_topology_node_ids_without_throwing()
    {
        GraphSnapshot graph = BuildSampleGraph();
        GraphNode duplicateNode = CreateTopologyNode(
            graph.Nodes[0].NodeId,
            "duplicate-vnet",
            "Microsoft.Network/virtualNetworks",
            "network-rg",
            "11111111-1111-1111-1111-111111111111",
            GraphTopologyCategories.Network);
        graph.Nodes.Add(duplicateNode);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().HaveCount(graph.Nodes.Count - 1);
        string mermaid = renderer.Render(ast);
        mermaid.Should().Contain("flowchart TD");
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

    private static GraphSnapshot BuildExecutiveVnetOnlyGraph()
    {
        return BuildExecutiveSparseVnetGraph(resourceGroupCount: 3);
    }

    private static GraphSnapshot BuildExecutiveMultiRegionVnetGraph()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        const string subscriptionId = "44444444-4444-4444-4444-444444444444";

        GraphNode vnetEast = CreateTopologyNode(
            "vnet-east",
            "vnet-eastus-hub",
            "Microsoft.Network/virtualNetworks",
            "network-rg-east",
            subscriptionId,
            GraphTopologyCategories.Network);
        vnetEast.Properties["arm.location"] = "eastus";

        GraphNode vnetWest = CreateTopologyNode(
            "vnet-west",
            "vnet-westus-spoke",
            "Microsoft.Network/virtualNetworks",
            "network-rg-west",
            subscriptionId,
            GraphTopologyCategories.Network);
        vnetWest.Properties["arm.location"] = "westus";

        GraphNode vnetNorth = CreateTopologyNode(
            "vnet-north",
            "vnet-northeurope-spoke",
            "Microsoft.Network/virtualNetworks",
            "network-rg-north",
            subscriptionId,
            GraphTopologyCategories.Network);
        vnetNorth.Properties["arm.location"] = "northeurope";

        string vnetEastArmId = DiagramAstGraphNodeClassifier.ReadArmId(vnetEast);

        graph.Nodes.Add(vnetEast);
        graph.Nodes.Add(vnetWest);
        graph.Nodes.Add(vnetNorth);
        graph.Nodes.Add(CreateTopologyNode(
            "subnet-1",
            "app-subnet",
            "Microsoft.Network/virtualNetworks/subnets",
            "network-rg-east",
            subscriptionId,
            GraphTopologyCategories.Network,
            vnetEastArmId));
        graph.Nodes.Add(CreateTopologyNode(
            "subnet-2",
            "data-subnet",
            "Microsoft.Network/virtualNetworks/subnets",
            "network-rg-east",
            subscriptionId,
            GraphTopologyCategories.Network,
            vnetEastArmId));

        graph.Edges.Add(new GraphEdge
        {
            EdgeId = "peering-east-west",
            FromNodeId = vnetEast.NodeId,
            ToNodeId = vnetWest.NodeId,
            EdgeType = GraphEdgeTypes.PeersWith,
            Weight = 1,
        });

        return graph;
    }

    private static GraphSnapshot BuildExecutiveSparseVnetGraph(int resourceGroupCount)
    {
        return BuildSparseSingleNodePerResourceGroupGraph(
            resourceGroupCount,
            nodeIdPrefix: "vnet",
            labelPrefix: "vnet-eastus",
            armType: "Microsoft.Network/virtualNetworks",
            resourceGroupPrefix: "network-rg",
            category: GraphTopologyCategories.Network);
    }

    private static GraphSnapshot BuildDataSparseStorageGraph(int resourceGroupCount)
    {
        return BuildSparseSingleNodePerResourceGroupGraph(
            resourceGroupCount,
            nodeIdPrefix: "storage",
            labelPrefix: "stdata",
            armType: "Microsoft.Storage/storageAccounts",
            resourceGroupPrefix: "data-rg",
            category: GraphTopologyCategories.Storage);
    }

    private static GraphSnapshot BuildIdentitySparseManagedIdentityGraph(int resourceGroupCount)
    {
        return BuildSparseSingleNodePerResourceGroupGraph(
            resourceGroupCount,
            nodeIdPrefix: "mi",
            labelPrefix: "mi-eastus",
            armType: "Microsoft.ManagedIdentity/userAssignedIdentities",
            resourceGroupPrefix: "identity-rg",
            category: GraphTopologyCategories.Identity);
    }

    private static GraphSnapshot BuildSparseSingleNodePerResourceGroupGraph(
        int resourceGroupCount,
        string nodeIdPrefix,
        string labelPrefix,
        string armType,
        string resourceGroupPrefix,
        string category)
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
                $"{nodeIdPrefix}-{index}",
                $"{labelPrefix}-{index}",
                armType,
                $"{resourceGroupPrefix}-{index}",
                subscriptionId,
                category));
        }

        return graph;
    }

    private static GraphSnapshot BuildExecutiveAlwaysShowGraph(int virtualMachineCount, int databaseCount, int dataFactoryCount)
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        const string subscriptionId = "55555555-5555-5555-5555-555555555555";

        graph.Nodes.Add(CreateTopologyNode(
            "vnet-hub",
            "hub-vnet",
            "Microsoft.Network/virtualNetworks",
            "rg-network",
            subscriptionId,
            GraphTopologyCategories.Network));
        graph.Nodes.Add(CreateTopologyNode(
            "storage-critical",
            "stcritical",
            "Microsoft.Storage/storageAccounts",
            "rg-data",
            subscriptionId,
            GraphTopologyCategories.Storage));
        graph.Nodes.Add(CreateTopologyNode(
            "nic-noise",
            "app-nic",
            "Microsoft.Network/networkInterfaces",
            "rg-app",
            subscriptionId,
            GraphTopologyCategories.Network));

        for (int index = 0; index < virtualMachineCount; index++)
        {
            graph.Nodes.Add(CreateTopologyNode(
                $"vm-{index}",
                $"vm-{index}",
                "Microsoft.Compute/virtualMachines",
                "rg-app",
                subscriptionId,
                GraphTopologyCategories.Compute));
        }

        for (int index = 0; index < databaseCount; index++)
        {
            graph.Nodes.Add(CreateTopologyNode(
                $"sqldb-{index}",
                $"sqldb-{index}",
                "Microsoft.Sql/servers/databases",
                "rg-data",
                subscriptionId,
                GraphTopologyCategories.Data));
        }

        for (int index = 0; index < dataFactoryCount; index++)
        {
            graph.Nodes.Add(CreateTopologyNode(
                $"adf-{index}",
                $"adf-{index}",
                "Microsoft.DataFactory/factories",
                "rg-data",
                subscriptionId,
                GraphTopologyCategories.Data));
        }

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

    [Fact]
    public void Compile_human_assertion_edge_carries_provenance_and_declared_label()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        graph.Nodes.Add(CreateTopologyNode(
            "app-1",
            "app-1",
            "Microsoft.Web/sites",
            "rg-app",
            "11111111-1111-1111-1111-111111111111",
            GraphTopologyCategories.Compute));
        graph.Nodes.Add(CreateTopologyNode(
            "sql-1",
            "sql-1",
            "Microsoft.Sql/servers",
            "rg-data",
            "11111111-1111-1111-1111-111111111111",
            GraphTopologyCategories.Data));
        graph.Edges.Add(new GraphEdge
        {
            EdgeId = "edge-declared",
            FromNodeId = "app-1",
            ToNodeId = "sql-1",
            EdgeType = GraphEdgeTypes.ConnectsTo,
            Label = GraphEdgeTypes.ConnectsTo,
            InferenceSource = GraphEdgeInferenceSources.HumanDeclaredConnection,
            ProvenanceKind = "HumanAssertion",
            DeclaredConnectionId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").ToString(),
        });
        graph.Edges.Add(new GraphEdge
        {
            EdgeId = "edge-inventory",
            FromNodeId = "app-1",
            ToNodeId = "sql-1",
            EdgeType = GraphEdgeTypes.ConnectsTo,
            Label = GraphEdgeTypes.ConnectsTo,
            InferenceSource = GraphEdgeInferenceSources.InventoryNicSubnet,
            ProvenanceKind = "ObservedFact",
        });

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);
        DiagramEdge? declaredEdge = ast.Edges.FirstOrDefault(edge =>
            edge.ProvenanceKind == "HumanAssertion");
        DiagramEdge? observedEdge = ast.Edges.FirstOrDefault(edge =>
            edge.ProvenanceKind == "ObservedFact");

        declaredEdge.Should().NotBeNull();
        declaredEdge!.InferenceSource.Should().Be(GraphEdgeInferenceSources.HumanDeclaredConnection);
        declaredEdge.DeclaredConnectionId.Should().NotBeNullOrWhiteSpace();
        declaredEdge.Label.Should().Be("declared · connects");

        observedEdge.Should().NotBeNull();
        observedEdge!.Label.Should().Be("connects");
        observedEdge.Label.Should().NotContain("declared");

        string mermaid = renderer.Render(ast);
        mermaid.Should().Contain("-.->");
        mermaid.Should().Contain("al-provenance=HumanAssertion");
        mermaid.Should().Contain("al-declared-id=");
    }

    private static GraphNode BuildNetworkTopologyNode(string nodeId, string armId, string armType, string label)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = armId,
                ["arm.type"] = armType,
                ["arm.resourceGroup"] = "rg",
                ["arm.subscriptionId"] = "sub",
            },
        };
    }
}
