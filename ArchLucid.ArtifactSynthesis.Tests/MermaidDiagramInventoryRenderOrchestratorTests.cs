using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
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
    }
}
