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
    public void MaterializeFromConstraintsMetadata_parses_budget_amounts(string constraint, string expectedAmount)
    {
        IReadOnlyList<GraphNode> nodes = RequestCostConstraintMaterializer.MaterializeFromConstraintsMetadata(
            constraint,
            Guid.NewGuid());

        nodes.Should().ContainSingle();
        nodes[0].Properties["maxMonthlyCost"].Should().Be(expectedAmount);
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
