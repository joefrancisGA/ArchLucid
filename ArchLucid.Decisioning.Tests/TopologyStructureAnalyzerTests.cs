using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class TopologyStructureAnalyzerTests
{
    [Fact]
    public void Analyze_WhenComputeExistsWithoutNetwork_EmitsComputeWithoutNetworkAnchorGap()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "cmp-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new()
                }
            ]
        };

        IReadOnlyList<TopologyStructureGap> gaps = TopologyStructureAnalyzer.Analyze(graph);

        gaps.Should().ContainSingle(g => g.GapCode == "compute-without-network-anchor");
    }

    [Fact]
    public void Analyze_WhenComputeNotLinkedToNetwork_EmitsContainmentGap()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "net-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vnet",
                    Category = GraphTopologyCategories.Network,
                    Properties = new()
                },
                new GraphNode
                {
                    NodeId = "cmp-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new()
                }
            ]
        };

        IReadOnlyList<TopologyStructureGap> gaps = TopologyStructureAnalyzer.Analyze(graph);

        gaps.Should().ContainSingle(g => g.GapCode == "compute-not-contained-in-network");
    }

    [Fact]
    public void Analyze_WhenComputeHasParentNetwork_DoesNotEmitContainmentGap()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "net-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vnet",
                    Category = GraphTopologyCategories.Network,
                    Properties = new()
                },
                new GraphNode
                {
                    NodeId = "cmp-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["parentNodeId"] = "net-1"
                    }
                }
            ]
        };

        TopologyStructureAnalyzer.Analyze(graph).Should().BeEmpty();
    }
}
