using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Category", "Unit")]
public sealed class GraphSnapshotKnowledgeModelMergerTests
{
    [Fact]
    public void Merge_prefers_model_nodes_and_unions_distinct_context_nodes_and_edges()
    {
        GraphSnapshot contextGraph = new()
        {
            GraphSnapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            Nodes =
            [
                new GraphNode { NodeId = "shared", NodeType = "context", Label = "context-shared" },
                new GraphNode { NodeId = "ctx-only", NodeType = "context", Label = "context-only" },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e-ctx-shared",
                    FromNodeId = "shared",
                    ToNodeId = "ctx-only",
                    EdgeType = "depends-on",
                },
            ],
            Warnings = ["context-warning"],
        };

        GraphSnapshot modelGraph = new()
        {
            GraphSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ContextSnapshotId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            CreatedUtc = new DateTime(2026, 8, 25, 0, 0, 0, DateTimeKind.Utc),
            Nodes =
            [
                new GraphNode { NodeId = "shared", NodeType = "model", Label = "model-shared" },
                new GraphNode { NodeId = "model-only", NodeType = "model", Label = "model-only" },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e-model",
                    FromNodeId = "shared",
                    ToNodeId = "model-only",
                    EdgeType = "depends-on",
                },
            ],
            Warnings = ["model-warning"],
        };

        GraphSnapshot merged = GraphSnapshotKnowledgeModelMerger.Merge(contextGraph, modelGraph);

        merged.GraphSnapshotId.Should().Be(modelGraph.GraphSnapshotId);
        merged.ContextSnapshotId.Should().Be(modelGraph.ContextSnapshotId);
        merged.RunId.Should().Be(modelGraph.RunId);
        merged.Nodes.Should().ContainSingle(node => node.NodeId == "shared" && node.Label == "model-shared");
        merged.Nodes.Should().Contain(node => node.NodeId == "ctx-only");
        merged.Nodes.Should().Contain(node => node.NodeId == "model-only");
        merged.Edges.Should().HaveCount(2);
        merged.Warnings.Should().Equal("model-warning", "context-warning");
    }

    [Fact]
    public void HasAny_is_true_only_for_projectable_element_kinds()
    {
        ArchitectureKnowledgeModel empty = new() { ModelId = "m", Elements = [] };
        ArchitectureKnowledgeModel decisionOnly = new()
        {
            ModelId = "m",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "d1",
                    Kind = ArchitectureElementKind.Decision,
                    Name = "Use queues",
                },
            ],
        };
        ArchitectureKnowledgeModel component = new()
        {
            ModelId = "m",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "c1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "API",
                },
            ],
        };

        ArchitectureKnowledgeModelProjectableElements.HasAny(null).Should().BeFalse();
        ArchitectureKnowledgeModelProjectableElements.HasAny(empty).Should().BeFalse();
        ArchitectureKnowledgeModelProjectableElements.HasAny(decisionOnly).Should().BeFalse();
        ArchitectureKnowledgeModelProjectableElements.HasAny(component).Should().BeTrue();
    }
}
