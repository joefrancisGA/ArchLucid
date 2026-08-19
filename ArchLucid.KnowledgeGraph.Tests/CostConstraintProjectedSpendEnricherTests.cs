using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Materialization;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Category", "Unit")]
public sealed class CostConstraintProjectedSpendEnricherTests
{
    [Fact]
    public async Task EnrichFromTopologyAsync_skips_cost_constraint_when_projected_spend_uses_noncanonical_key_casing()
    {
        List<GraphNode> nodes =
        [
            new GraphNode
            {
                NodeId = "top-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string>(),
            },
            new GraphNode
            {
                NodeId = "cost-1",
                NodeType = GraphNodeTypes.CostConstraint,
                Label = "Budget",
                Properties = new Dictionary<string, string>
                {
                    ["ProjectedMonthlySpendUsd"] = "5000",
                    ["projectedImpactUsdLowerBound"] = "4500",
                    ["projectedImpactUsdUpperBound"] = "5500",
                },
            },
        ];

        await CostConstraintProjectedSpendEnricher.EnrichFromTopologyAsync(nodes, CancellationToken.None);

        nodes[1].Properties["ProjectedMonthlySpendUsd"].Should().Be("5000");
        nodes[1].Properties["projectedImpactUsdLowerBound"].Should().Be("4500");
        nodes[1].Properties["projectedImpactUsdUpperBound"].Should().Be("5500");
    }
}
