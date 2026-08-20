using System.Globalization;

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

    [Fact]
    public async Task EnrichFromTopologyAsync_scales_topology_projection_when_instance_count_uses_pascal_case_keys()
    {
        List<GraphNode> scaledNodes = BuildTopologyAndBudgetNodes("InstanceCount", "5");
        List<GraphNode> baselineNodes = BuildTopologyAndBudgetNodes("instanceCount", "1");

        await CostConstraintProjectedSpendEnricher.EnrichFromTopologyAsync(scaledNodes, CancellationToken.None);
        await CostConstraintProjectedSpendEnricher.EnrichFromTopologyAsync(baselineNodes, CancellationToken.None);

        decimal scaledSpend = decimal.Parse(
            scaledNodes[1].Properties["projectedMonthlySpendUsd"],
            CultureInfo.InvariantCulture);
        decimal baselineSpend = decimal.Parse(
            baselineNodes[1].Properties["projectedMonthlySpendUsd"],
            CultureInfo.InvariantCulture);

        scaledSpend.Should().BeGreaterThan(baselineSpend * 4m);
    }

    private static List<GraphNode> BuildTopologyAndBudgetNodes(string instanceCountKey, string instanceCountValue)
    {
        return
        [
            new GraphNode
            {
                NodeId = "top-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string>
                {
                    [instanceCountKey] = instanceCountValue,
                },
            },
            new GraphNode
            {
                NodeId = "cost-1",
                NodeType = GraphNodeTypes.CostConstraint,
                Label = "Budget",
                Properties = new Dictionary<string, string>(),
            },
        ];
    }
}
