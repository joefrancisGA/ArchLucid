using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Contracts.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GraphTopologyPriorOrderingRegressionTests
{
    [Fact]
    public void Stored_prior_categories_have_stable_order_and_do_not_duplicate_case_variants()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "Context",
                    Properties = new Dictionary<string, string>
                    {
                        [ContextGraphPropertyKeys.PriorTopologyCategories] = "storage | compute | STORAGE | network",
                    },
                },
            ],
        };

        TopologyCategoryDiffResult diff = GraphSnapshotTopologyDiffAnalyzer.AnalyzeCategoryDelta(graph);

        diff.PriorCategories.Should().Equal("compute", "network", "storage");
        diff.RemovedCategories.Should().Equal("compute", "network", "storage");
        diff.AddedCategories.Should().BeEmpty();
    }
}
