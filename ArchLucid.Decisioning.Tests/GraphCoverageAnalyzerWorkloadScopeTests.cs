using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class GraphCoverageAnalyzerWorkloadScopeTests
{
    private readonly GraphCoverageAnalyzer _analyzer = new();

    [Fact]
    public void AnalyzeTopology_WhenStaticSpaScope_DoesNotRequireStorageCategory()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                ContextNode("Static SPA behind Front Door"),
                new GraphNode
                {
                    NodeId = "net-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "front-door",
                    Category = GraphTopologyCategories.Network,
                    Properties = new()
                },
                new GraphNode
                {
                    NodeId = "cmp-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "web",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new()
                }
            ]
        };

        TopologyCoverageResult result = _analyzer.AnalyzeTopology(graph);

        result.MissingCategories.Should().NotContain(GraphTopologyCategories.Storage);
        result.MissingCategories.Should().Contain(GraphTopologyCategories.Data);
    }

    private static GraphNode ContextNode(string requiredCapabilities)
    {
        return new GraphNode
        {
            NodeId = "context-1",
            NodeType = GraphNodeTypes.ContextSnapshot,
            Label = "context",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [ContextGraphPropertyKeys.RequiredCapabilities] = requiredCapabilities
            }
        };
    }
}
