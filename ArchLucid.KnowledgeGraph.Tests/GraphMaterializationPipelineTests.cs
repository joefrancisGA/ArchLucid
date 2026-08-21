using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph.Builders;
using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.KnowledgeGraph.Mapping;
using ArchLucid.KnowledgeGraph.Materialization;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class GraphMaterializationPipelineTests
{
    [Fact]
    public void CreateDefaultPipeline_RegistersExpectedStageOrder()
    {
        GraphMaterializationPipeline pipeline = GraphMaterializationStages.CreateDefaultPipeline(new Mock<IGraphNodeFactory>().Object);

        pipeline.Stages.Select(stage => stage.Name).Should().Equal([
            "canonical-objects",
            "request-cost-constraints",
            "request-actors",
            "request-assumptions",
            "request-quality-attributes",
            "request-failure-modes",
            "cost-projected-spend-enrichment",
        ]);
    }

    [Fact]
    public async Task RunAsync_AppliesMetadataMaterializersWhenCanonicalObjectsMissing()
    {
        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "project-1",
            SourceHashes = new Dictionary<string, string>
            {
                [ContextScopeMetadataKeys.Actors] = "[]",
            },
        };

        List<GraphNode> nodes = [CreateContextNode(snapshot)];
        GraphMaterializationContext context = new(snapshot, nodes);
        GraphMaterializationPipeline pipeline = GraphMaterializationStages.CreateDefaultPipeline(new Mock<IGraphNodeFactory>(MockBehavior.Strict).Object);

        await pipeline.RunAsync(context, CancellationToken.None);

        nodes.Should().Contain(node => node.NodeType == GraphNodeTypes.ContextSnapshot);
    }

    [Fact]
    public async Task RunAsync_Sets_WafAligned_when_associated_findings_key_uses_PascalCase()
    {
        ContextSnapshot snapshot = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "project-1",
            CanonicalObjects =
            [
                new CanonicalObject
                {
                    ObjectId = "svc-api",
                    ObjectType = GraphNodeTypes.TopologyResource,
                    Name = "api",
                    SourceType = "Manual",
                    SourceId = "svc-api",
                    Properties = new Dictionary<string, string>
                    {
                        ["AssociatedFindings"] = "Aligned with WAF baseline"
                    }
                }
            ],
        };

        List<GraphNode> nodes = [CreateContextNode(snapshot)];
        GraphMaterializationContext context = new(snapshot, nodes);
        GraphMaterializationPipeline pipeline = GraphMaterializationStages.CreateDefaultPipeline(new GraphNodeFactory());

        await pipeline.RunAsync(context, CancellationToken.None);

        GraphNode materialized = nodes.Should().ContainSingle(n => n.NodeId == "obj-svc-api").Subject;
        materialized.Properties.Should().ContainKey("WafAligned");
        materialized.Properties["WafAligned"].Should().Be("true");
    }

    [Fact]
    public async Task DefaultGraphBuilder_UsesPipelineWithoutChangingEmptySnapshotBehavior()
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
            ProjectId = "project-1",
        };

        GraphBuildResult result = await sut.BuildAsync(snapshot, CancellationToken.None);

        result.Nodes.Should().ContainSingle(node => node.NodeType == GraphNodeTypes.ContextSnapshot);
        result.Edges.Should().BeEmpty();
    }

    private static GraphNode CreateContextNode(ContextSnapshot snapshot)
    {
        return new GraphNode
        {
            NodeId = $"context-{snapshot.SnapshotId:N}",
            NodeType = GraphNodeTypes.ContextSnapshot,
            Label = $"Context Snapshot {snapshot.SnapshotId:N}",
            SourceType = GraphNodeTypes.ContextSnapshot,
            SourceId = snapshot.SnapshotId.ToString(),
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
        };
    }
}
