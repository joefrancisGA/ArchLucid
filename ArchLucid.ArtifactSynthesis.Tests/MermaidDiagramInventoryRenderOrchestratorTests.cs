using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.InfraEvidence.DiagramPeel;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class MermaidDiagramInventoryRenderOrchestratorTests
{
    private readonly MermaidDiagramInventoryRenderOrchestrator orchestrator = CreateOrchestrator();

    [Fact]
    public async Task RenderFromGraphAsync_network_mode_peels_nics_to_fit_node_budget()
    {
        GraphSnapshot graph = BuildNetworkHeavyGraph(vnetCount: 12, nicPerVnet: 34);

        MermaidDiagramRenderResult result = await orchestrator.RenderFromGraphAsync(
            graph,
            DiagramMode.Network,
            null,
            new MermaidDiagramReadabilityThresholds { MaxNodes = 400 });

        result.Status.Should().Be(MermaidDiagramRenderStatus.Succeeded);
        result.Metrics.NodeCount.Should().BeLessThanOrEqualTo(400);
        result.CollapseReport!.Entries.Should().Contain(
            entry => entry.Kind == "PeelBudgetArmType"
                && entry.Reason.Contains("Microsoft.Network/networkInterfaces", StringComparison.Ordinal));
    }

    [Fact]
    public async Task RenderFromGraphAsync_executive_mode_does_not_apply_peel_budget()
    {
        GraphSnapshot graph = BuildNetworkHeavyGraph(vnetCount: 500, nicPerVnet: 2);

        MermaidDiagramRenderResult result = await orchestrator.RenderFromGraphAsync(
            graph,
            DiagramMode.Executive,
            null,
            new MermaidDiagramReadabilityThresholds { MaxNodes = 1 });

        result.CollapseReport!.Entries.Should().NotContain(entry => entry.Kind == "PeelBudgetArmType");
        result.Status.Should().Be(MermaidDiagramRenderStatus.Succeeded);
        result.Metrics.NodeCount.Should().BeLessThanOrEqualTo(DiagramAstFromGraphCompilerConstants.ExecutiveMaxResourceNodes);
    }

    [Fact]
    public void BuildFallbackArtifact_executive_eleven_disconnected_vnets_succeeds()
    {
        GraphSnapshot graph = BuildExecutiveSparseVnetGraph(vnetCount: 11);

        MermaidDiagramRenderArtifact artifact = orchestrator.BuildFallbackArtifact(
            graph,
            DiagramMode.Executive,
            "executive",
            "Executive (executive)",
            new MermaidDiagramReadabilityThresholds { MaxNodes = 400 },
            null);

        artifact.Status.Should().Be(MermaidDiagramRenderStatus.Succeeded);
        artifact.Metrics.Should().NotBeNull();
        artifact.Metrics!.NodeCount.Should().Be(11);
        artifact.Metrics.EdgeCount.Should().Be(0);
        artifact.Mermaid.Should().Contain("~~~");
    }

    [Fact]
    public async Task RenderFromGraphAsync_executive_eleven_disconnected_vnets_succeeds()
    {
        GraphSnapshot graph = BuildExecutiveSparseVnetGraph(vnetCount: 11);

        MermaidDiagramRenderResult result = await orchestrator.RenderFromGraphAsync(
            graph,
            DiagramMode.Executive,
            null,
            new MermaidDiagramReadabilityThresholds { MaxNodes = 400 });

        result.Status.Should().Be(MermaidDiagramRenderStatus.Succeeded);
        result.Metrics.NodeCount.Should().Be(11);
        result.PrimaryMermaid.Should().Contain("~~~");
    }

    [Fact]
    public void BuildFallbackArtifact_peels_network_mode_for_partitioned_graph()
    {
        GraphSnapshot graph = BuildNetworkHeavyGraph(vnetCount: 12, nicPerVnet: 34);

        MermaidDiagramRenderArtifact artifact = orchestrator.BuildFallbackArtifact(
            graph,
            DiagramMode.Network,
            "network",
            "Network (network)",
            new MermaidDiagramReadabilityThresholds { MaxNodes = 400 },
            null);

        artifact.Status.Should().Be(MermaidDiagramRenderStatus.Succeeded);
        artifact.Metrics.Should().NotBeNull();
        artifact.Metrics!.NodeCount.Should().BeLessThanOrEqualTo(400);
    }

    [Fact]
    public async Task RenderFromGraphAsync_full_subscription_collapses_to_resource_group_map_when_leaf_exceeds_budget()
    {
        GraphSnapshot graph = BuildMultiResourceGroupVnetGraph(resourceGroupCount: 12, vnetsPerGroup: 40);

        MermaidDiagramRenderResult result = await orchestrator.RenderFromGraphAsync(
            graph,
            DiagramMode.FullSubscription,
            null,
            new MermaidDiagramReadabilityThresholds { MaxNodes = 400 });

        result.Status.Should().Be(MermaidDiagramRenderStatus.Succeeded);
        result.Metrics.NodeCount.Should().Be(12);
        result.PrimaryMermaid.Should().Contain("al-view=resource-group-map");
        result.CollapseReport!.Entries.Should().Contain(entry =>
            entry.Kind == InventoryDiagramResourceGroupMapBuilder.CollapseKind);
    }

    [Fact]
    public async Task RenderFromGraphAsync_full_subscription_stays_partitioned_when_a_single_resource_group_exceeds_budget()
    {
        GraphSnapshot graph = BuildMultiResourceGroupVnetGraph(resourceGroupCount: 1, vnetsPerGroup: 500);

        MermaidDiagramRenderResult result = await orchestrator.RenderFromGraphAsync(
            graph,
            DiagramMode.FullSubscription,
            null,
            new MermaidDiagramReadabilityThresholds { MaxNodes = 400 });

        result.Status.Should().Be(MermaidDiagramRenderStatus.Partitioned);
        result.Metrics.NodeCount.Should().BeGreaterThan(400);
        result.CollapseReport!.Entries.Should().NotContain(entry =>
            entry.Kind == InventoryDiagramResourceGroupMapBuilder.CollapseKind);
        result.FallbackArtifacts.Should().NotContain(artifact =>
            InventoryDiagramFallbackArtifactKeys.IsFullMachine(artifact.Key));
    }

    [Fact]
    public async Task RenderFromGraphAsync_full_subscription_keeps_vms_and_databases_instead_of_resource_group_map()
    {
        GraphSnapshot graph = BuildFullSubscriptionBackboneWithNoise(resourceGroupCount: 12, nsgPerGroup: 40);

        MermaidDiagramRenderResult result = await orchestrator.RenderFromGraphAsync(
            graph,
            DiagramMode.FullSubscription,
            null,
            new MermaidDiagramReadabilityThresholds { MaxNodes = 400 });

        result.Status.Should().Be(MermaidDiagramRenderStatus.Succeeded);
        result.PrimaryMermaid.Should().Contain("al-view=backbone-keep");
        result.PrimaryMermaid.Should().NotContain("al-view=resource-group-map");
        result.PrimaryMermaid.Should().Contain("vm-0");
        result.PrimaryMermaid.Should().Contain("sqldb-0");
        result.CollapseReport!.Entries.Should().Contain(entry =>
            entry.Kind == InventoryDiagramBackboneArmTypes.CollapseKind);
        result.CollapseReport.Entries.Should().NotContain(entry =>
            entry.Kind == InventoryDiagramResourceGroupMapBuilder.CollapseKind);
        result.Metrics.NodeCount.Should().Be(36);
    }

    [Fact]
    public async Task RenderFromGraphAsync_always_disposes_dashboards_extensions_dns_and_maintenance()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                CreateTopology("vm-1", "Microsoft.Compute/virtualMachines"),
                CreateTopology("dash-1", "Microsoft.Portal/dashboards"),
                CreateTopology("ext-1", "Microsoft.Compute/virtualMachines/extensions"),
                CreateTopology("dns-1", "Microsoft.Network/dnszones"),
                CreateTopology("mw-1", "Microsoft.Maintenance/maintenanceConfigurations"),
            ],
        };

        MermaidDiagramRenderResult result = await orchestrator.RenderFromGraphAsync(
            graph,
            DiagramMode.Executive,
            null,
            new MermaidDiagramReadabilityThresholds { MaxNodes = 400 });

        result.Status.Should().Be(MermaidDiagramRenderStatus.Succeeded);
        result.PrimaryMermaid.Should().Contain("vm-1");
        result.PrimaryMermaid.Should().NotContain("dash-1");
        result.PrimaryMermaid.Should().NotContain("ext-1");
        result.PrimaryMermaid.Should().NotContain("dns-1");
        result.PrimaryMermaid.Should().NotContain("mw-1");
        result.CollapseReport!.Entries.Should().Contain(entry =>
            entry.Kind == AzureInventoryNeverShowArmTypes.DiagramCollapseKind
            && entry.Reason.Contains("Microsoft.Portal/dashboards", StringComparison.Ordinal));
    }

    [Fact]
    public async Task RenderFromGraphAsync_includes_always_disposed_types_when_requested()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                CreateTopology("vm-1", "Microsoft.Compute/virtualMachines"),
                CreateTopology("dash-1", "Microsoft.Portal/dashboards"),
                CreateTopology("dns-1", "Microsoft.Network/dnszones"),
            ],
        };

        MermaidDiagramRenderResult result = await orchestrator.RenderFromGraphAsync(
            graph,
            DiagramMode.Executive,
            null,
            new MermaidDiagramReadabilityThresholds { MaxNodes = 400 },
            includeNeverShowArmTypes: true);

        result.Status.Should().Be(MermaidDiagramRenderStatus.Succeeded);
        result.PrimaryMermaid.Should().Contain("vm-1");
        result.PrimaryMermaid.Should().Contain("dash-1");
        result.PrimaryMermaid.Should().Contain("dns-1");
        result.CollapseReport!.Entries.Should().NotContain(entry =>
            entry.Kind == AzureInventoryNeverShowArmTypes.DiagramCollapseKind);
    }

    private static GraphNode CreateTopology(string nodeId, string armType)
    {
        GraphNode node = new()
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = nodeId,
            SourceType = "azure-inventory-snapshot",
        };
        node.Properties["arm.type"] = armType;

        return node;
    }

    private static MermaidDiagramInventoryRenderOrchestrator CreateOrchestrator()
    {
        MermaidDiagramRenderPipeline pipeline = new(
            new MermaidDiagramRenderer(),
            new MermaidDiagramComplexityAnalyzer(),
            new MermaidDiagramDeterministicRepairer(),
            new MermaidDiagramStructuralValidator(),
            new MermaidDiagramSemanticIntegrityGuard(),
            new EmptyMermaidDiagramFallbackSetBuilder());

        return new MermaidDiagramInventoryRenderOrchestrator(
            new DiagramAstFromGraphCompiler(),
            pipeline,
            new DiagramPeelCatalogDefaultProvider(),
            new MermaidDiagramRenderer(),
            new MermaidDiagramComplexityAnalyzer(),
            new MermaidDiagramDeterministicRepairer(),
            new MermaidDiagramStructuralValidator());
    }

    private static GraphSnapshot BuildMultiResourceGroupVnetGraph(int resourceGroupCount, int vnetsPerGroup)
    {
        List<GraphNode> nodes = [];
        List<GraphEdge> edges = [];
        int edgeIndex = 0;

        for (int groupIndex = 0; groupIndex < resourceGroupCount; groupIndex++)
        {
            string resourceGroup = $"rg-{groupIndex}";

            for (int vnetIndex = 0; vnetIndex < vnetsPerGroup; vnetIndex++)
            {
                string vnetNodeId = Guid.NewGuid().ToString("D");
                string vnetArmId =
                    $"/subscriptions/sub/resourceGroups/{resourceGroup}/providers/Microsoft.Network/virtualNetworks/vnet-{groupIndex}-{vnetIndex}";

                nodes.Add(CreateTopologyNode(
                    vnetNodeId,
                    $"vnet-{groupIndex}-{vnetIndex}",
                    "Microsoft.Network/virtualNetworks",
                    vnetArmId,
                    resourceGroup));

                if (vnetIndex > 0)
                {
                    edges.Add(new GraphEdge
                    {
                        EdgeId = $"edge-{edgeIndex++}",
                        FromNodeId = nodes[^2].NodeId,
                        ToNodeId = vnetNodeId,
                        EdgeType = GraphEdgeTypes.ConnectsTo,
                        Weight = 1.0d,
                    });
                }
            }
        }

        return new GraphSnapshot
        {
            Nodes = nodes,
            Edges = edges,
        };
    }

    private static GraphSnapshot BuildFullSubscriptionBackboneWithNoise(int resourceGroupCount, int nsgPerGroup)
    {
        List<GraphNode> nodes = [];
        List<GraphEdge> edges = [];
        int edgeIndex = 0;

        for (int groupIndex = 0; groupIndex < resourceGroupCount; groupIndex++)
        {
            string resourceGroup = $"rg-{groupIndex}";
            string vmNodeId = Guid.NewGuid().ToString("D");
            string dbNodeId = Guid.NewGuid().ToString("D");
            string vmArmId =
                $"/subscriptions/sub/resourceGroups/{resourceGroup}/providers/Microsoft.Compute/virtualMachines/vm-{groupIndex}";
            string dbArmId =
                $"/subscriptions/sub/resourceGroups/{resourceGroup}/providers/Microsoft.Sql/servers/sql-{groupIndex}/databases/sqldb-{groupIndex}";

            nodes.Add(CreateTopologyNode(
                vmNodeId,
                $"vm-{groupIndex}",
                "Microsoft.Compute/virtualMachines",
                vmArmId,
                resourceGroup));
            nodes.Add(CreateTopologyNode(
                Guid.NewGuid().ToString("D"),
                $"sql-{groupIndex}",
                "Microsoft.Sql/servers",
                $"/subscriptions/sub/resourceGroups/{resourceGroup}/providers/Microsoft.Sql/servers/sql-{groupIndex}",
                resourceGroup));
            nodes.Add(CreateTopologyNode(
                dbNodeId,
                $"sqldb-{groupIndex}",
                "Microsoft.Sql/servers/databases",
                dbArmId,
                resourceGroup));

            edges.Add(new GraphEdge
            {
                EdgeId = $"edge-{edgeIndex++}",
                FromNodeId = vmNodeId,
                ToNodeId = dbNodeId,
                EdgeType = GraphEdgeTypes.ConnectsTo,
                Weight = 1.0d,
            });

            for (int nsgIndex = 0; nsgIndex < nsgPerGroup; nsgIndex++)
            {
                string nsgNodeId = Guid.NewGuid().ToString("D");
                string nsgArmId =
                    $"/subscriptions/sub/resourceGroups/{resourceGroup}/providers/Microsoft.Network/networkSecurityGroups/nsg-{groupIndex}-{nsgIndex}";

                nodes.Add(CreateTopologyNode(
                    nsgNodeId,
                    $"nsg-{groupIndex}-{nsgIndex}",
                    "Microsoft.Network/networkSecurityGroups",
                    nsgArmId,
                    resourceGroup));
            }
        }

        return new GraphSnapshot
        {
            Nodes = nodes,
            Edges = edges,
        };
    }

    private static GraphSnapshot BuildNetworkHeavyGraph(int vnetCount, int nicPerVnet)
    {
        List<GraphNode> nodes = [];
        List<GraphEdge> edges = [];
        int edgeIndex = 0;

        for (int vnetIndex = 0; vnetIndex < vnetCount; vnetIndex++)
        {
            string vnetNodeId = Guid.NewGuid().ToString("D");
            string vnetArmId =
                $"/subscriptions/sub/resourceGroups/rg-{vnetIndex}/providers/Microsoft.Network/virtualNetworks/vnet-{vnetIndex}";

            nodes.Add(CreateTopologyNode(
                vnetNodeId,
                $"vnet-{vnetIndex}",
                "Microsoft.Network/virtualNetworks",
                vnetArmId,
                $"rg-{vnetIndex}"));

            for (int nicIndex = 0; nicIndex < nicPerVnet; nicIndex++)
            {
                string nicNodeId = Guid.NewGuid().ToString("D");
                string nicArmId =
                    $"/subscriptions/sub/resourceGroups/rg-{vnetIndex}/providers/Microsoft.Network/networkInterfaces/nic-{vnetIndex}-{nicIndex}";

                nodes.Add(CreateTopologyNode(
                    nicNodeId,
                    $"nic-{vnetIndex}-{nicIndex}",
                    "Microsoft.Network/networkInterfaces",
                    nicArmId,
                    $"rg-{vnetIndex}"));

                edges.Add(new GraphEdge
                {
                    EdgeId = $"edge-{edgeIndex++}",
                    FromNodeId = nicNodeId,
                    ToNodeId = vnetNodeId,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 1.0d,
                });
            }
        }

        return new GraphSnapshot
        {
            Nodes = nodes,
            Edges = edges,
        };
    }

    private static GraphSnapshot BuildExecutiveSparseVnetGraph(int vnetCount)
    {
        List<GraphNode> nodes = [];

        for (int index = 0; index < vnetCount; index++)
        {
            string nodeId = $"vnet-{index}";
            string resourceGroup = $"network-rg-{index}";
            string armId =
                $"/subscriptions/sub/resourceGroups/{resourceGroup}/providers/Microsoft.Network/virtualNetworks/vnet-eastus-{index}";

            nodes.Add(CreateTopologyNode(
                nodeId,
                $"vnet-eastus-{index}",
                "Microsoft.Network/virtualNetworks",
                armId,
                resourceGroup));
        }

        return new GraphSnapshot
        {
            Nodes = nodes,
        };
    }

    private static GraphNode CreateTopologyNode(
        string nodeId,
        string label,
        string armType,
        string armId,
        string resourceGroup)
    {
        GraphNode node = new()
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            Category = GraphTopologyCategories.Network,
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
        };

        node.Properties["arm.id"] = armId;
        node.Properties["arm.type"] = armType;
        node.Properties["arm.resourceGroup"] = resourceGroup;
        node.Properties["arm.subscriptionId"] = "sub";

        return node;
    }

    private sealed class EmptyMermaidDiagramFallbackSetBuilder : IMermaidDiagramFallbackSetBuilder
    {
        public IReadOnlyList<MermaidDiagramRenderArtifact> BuildFallbackSet(
            GraphSnapshot graph,
            MermaidDiagramReadabilityThresholds thresholds)
        {
            return [];
        }

        public IReadOnlyList<MermaidDiagramRenderArtifact> BuildResourceGroupFallbackSet(
            GraphSnapshot graph,
            MermaidDiagramReadabilityThresholds thresholds)
        {
            return [];
        }
    }
}
