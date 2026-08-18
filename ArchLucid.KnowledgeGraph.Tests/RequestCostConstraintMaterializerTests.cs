using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Builders;
using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Mapping;
using ArchLucid.KnowledgeGraph.Materialization;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RequestCostConstraintMaterializerTests
{
    [Fact]
    public void MaterializeFromConstraintsMetadata_returns_empty_when_constraints_missing()
    {
        RequestCostConstraintMaterializer
            .MaterializeFromConstraintsMetadata(null, Guid.NewGuid())
            .Should()
            .BeEmpty();
    }

    [Theory]
    [InlineData("Monthly budget cap $5000", "5000")]
    [InlineData("Keep spend under 12k USD per month", "12000")]
    [InlineData("FinOps: max $2,500/month", "2500")]
    [InlineData("2 regions, budget $12000 per month", "12000")]
    public void MaterializeFromConstraintsMetadata_parses_budget_amounts(string constraint, string expectedAmount)
    {
        IReadOnlyList<GraphNode> nodes = RequestCostConstraintMaterializer.MaterializeFromConstraintsMetadata(
            constraint,
            Guid.NewGuid());

        nodes.Should().ContainSingle();
        nodes[0].Properties["maxMonthlyCost"].Should().Be(expectedAmount);
    }

    [Fact]
    public void MaterializeFromConstraintsMetadata_ignores_bare_numbers_without_currency_marker()
    {
        IReadOnlyList<GraphNode> nodes = RequestCostConstraintMaterializer.MaterializeFromConstraintsMetadata(
            "2 regions with 3 availability zones and budget discipline",
            Guid.NewGuid());

        nodes.Should().ContainSingle();
        nodes[0].Properties.Should().NotContainKey("maxMonthlyCost");
    }

    [Theory]
    [InlineData("USDA export controls")]
    [InlineData("accost recovery SLA")]
    public void MaterializeFromConstraintsMetadata_skips_false_positive_cost_keyword_substrings(string constraint)
    {
        RequestCostConstraintMaterializer
            .MaterializeFromConstraintsMetadata(constraint, Guid.NewGuid())
            .Should()
            .BeEmpty();
    }

    [Fact]
    public void MaterializeFromConstraintsMetadata_emits_cost_constraint_nodes_for_cost_related_chips()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        IReadOnlyList<GraphNode> nodes = RequestCostConstraintMaterializer.MaterializeFromConstraintsMetadata(
            "HTTPS only|Monthly budget $5000|Private networking",
            snapshotId);

        nodes.Should().ContainSingle();
        nodes[0].NodeType.Should().Be(GraphNodeTypes.CostConstraint);
        nodes[0].Properties["maxMonthlyCost"].Should().Be("5000");
        nodes[0].Properties["sourceConstraint"].Should().Be("Monthly budget $5000");
    }

    [Theory]
    [InlineData("Monthly budget $5000, projected spend $6200", "6200")]
    [InlineData("Expected spend $8k per month with finops review", "8000")]
    public void MaterializeFromConstraintsMetadata_parses_projected_spend_amounts(string constraint, string expectedProjected)
    {
        IReadOnlyList<GraphNode> nodes = RequestCostConstraintMaterializer.MaterializeFromConstraintsMetadata(
            constraint,
            Guid.NewGuid());

        nodes.Should().ContainSingle();
        nodes[0].Properties["projectedMonthlySpendUsd"].Should().Be(expectedProjected);
        nodes[0].Properties.Should().ContainKey("projectedImpactUsdUpperBound");
    }

    [Fact]
    public async Task BuildAsync_with_topology_and_budget_cap_enriches_projected_spend()
    {
        Mock<IGraphEdgeInferer> edgeInferer = new();
        edgeInferer
            .Setup(e => e.InferEdges(It.IsAny<ContextSnapshot>(), It.IsAny<IReadOnlyList<GraphNode>>()))
            .Returns([]);

        Mock<IGraphNodeFactory> nodeFactory = new();
        nodeFactory
            .Setup(f => f.CreateNode(It.IsAny<CanonicalObject>()))
            .Returns<CanonicalObject>(item => new GraphNode
            {
                NodeId = item.ObjectId,
                NodeType = item.ObjectType,
                Label = item.Name,
                Category = item.Properties.TryGetValue("category", out string? category) ? category : null,
                Properties = new Dictionary<string, string>(item.Properties, StringComparer.OrdinalIgnoreCase),
            });

        DefaultGraphBuilder sut = new(nodeFactory.Object, edgeInferer.Object);
        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "proj-cost-topology",
            SourceHashes =
            {
                [ContextScopeMetadataKeys.Constraints] = "Monthly budget cap $100"
            },
            CanonicalObjects =
            [
                new CanonicalObject
                {
                    ObjectId = "cmp-1",
                    ObjectType = GraphNodeTypes.TopologyResource,
                    Name = "api",
                    SourceType = "test",
                    SourceId = "cmp-1",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["category"] = GraphTopologyCategories.Compute,
                    },
                },
                new CanonicalObject
                {
                    ObjectId = "data-1",
                    ObjectType = GraphNodeTypes.TopologyResource,
                    Name = "sql",
                    SourceType = "test",
                    SourceId = "data-1",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["category"] = GraphTopologyCategories.Data,
                    },
                },
            ],
        };

        GraphBuildResult result = await sut.BuildAsync(snapshot, CancellationToken.None);

        GraphNode costNode = result.Nodes.Should().Contain(n => n.NodeType == GraphNodeTypes.CostConstraint).Subject;
        costNode.Properties["maxMonthlyCost"].Should().Be("100");
        costNode.Properties.Should().ContainKey("projectedMonthlySpendUsd");
        decimal.Parse(costNode.Properties["projectedMonthlySpendUsd"]).Should().BeGreaterThan(100m);
    }

    [Fact]
    public async Task BuildAsync_empty_snapshot_with_cost_constraint_still_materializes_cost_nodes()
    {
        Mock<IGraphEdgeInferer> edgeInferer = new();
        edgeInferer
            .Setup(e => e.InferEdges(It.IsAny<ContextSnapshot>(), It.IsAny<IReadOnlyList<GraphNode>>()))
            .Returns([]);

        DefaultGraphBuilder sut = new(new Mock<IGraphNodeFactory>().Object, edgeInferer.Object);
        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "proj-cost",
            SourceHashes =
            {
                [ContextScopeMetadataKeys.Constraints] = "Monthly budget cap $2500"
            }
        };

        GraphBuildResult result = await sut.BuildAsync(snapshot, CancellationToken.None);

        result.Nodes.Should().HaveCount(2);
        result.Nodes.Should().Contain(n => n.NodeType == GraphNodeTypes.ContextSnapshot);
        result.Nodes.Should().Contain(n =>
            n.NodeType == GraphNodeTypes.CostConstraint
            && n.Properties["maxMonthlyCost"] == "2500");
    }
}
