using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class GraphSnapshotTopologyDiffAnalyzerTests
{
    [Fact]
    public void AnalyzeCategoryDelta_WhenPriorCategoriesPresent_ReportsAddedAndRemoved()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "context",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [ContextGraphPropertyKeys.PriorTopologyCategories] = "network|compute|storage"
                    }
                },
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
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    Properties = new()
                }
            ]
        };

        TopologyCategoryDiffResult diff = GraphSnapshotTopologyDiffAnalyzer.AnalyzeCategoryDelta(graph);

        diff.RemovedCategories.Should().Contain("storage");
        diff.AddedCategories.Should().Contain("data");
    }
}
