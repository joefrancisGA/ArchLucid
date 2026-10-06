using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Persistence.Graph;

[Trait("Category", "Unit")]
public sealed class GraphSnapshotKnowledgeModelMergerModelEdgeEndpointTests
{
    [Fact]
    public void Merge_canonicalizes_model_edge_endpoints_when_node_ids_are_trimmed()
    {
        GraphSnapshot contextGraph = new() { Nodes = [], Edges = [] };

        GraphSnapshot modelGraph = new()
        {
            GraphSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Nodes =
            [
                new GraphNode { NodeId = "shared", NodeType = "model", Label = "model-shared" },
                new GraphNode { NodeId = "target", NodeType = "model", Label = "model-target" },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e-padded-model",
                    FromNodeId = " shared ",
                    ToNodeId = " target ",
                    EdgeType = "depends-on",
                },
            ],
        };

        GraphSnapshot merged = GraphSnapshotKnowledgeModelMerger.Merge(contextGraph, modelGraph);

        merged.Edges.Should().ContainSingle();
        merged.Edges[0].FromNodeId.Should().Be("shared");
        merged.Edges[0].ToNodeId.Should().Be("target");
    }

    [Fact]
    public void Merge_deduplicates_model_nodes_when_node_id_differs_only_by_outer_whitespace()
    {
        GraphSnapshot contextGraph = new() { Nodes = [], Edges = [] };

        GraphSnapshot modelGraph = new()
        {
            GraphSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Nodes =
            [
                new GraphNode { NodeId = "shared", NodeType = "model", Label = "model-shared" },
                new GraphNode { NodeId = " shared ", NodeType = "model", Label = "model-shared-padded" },
            ],
        };

        GraphSnapshot merged = GraphSnapshotKnowledgeModelMerger.Merge(contextGraph, modelGraph);

        merged.Nodes.Should().HaveCount(1);
        merged.Nodes[0].NodeId.Should().Be("shared");
        merged.Nodes[0].Label.Should().Be("model-shared");
    }

    [Fact]
    public void Merge_deduplicates_model_edges_when_endpoints_and_type_differ_only_by_outer_whitespace()
    {
        GraphSnapshot contextGraph = new() { Nodes = [], Edges = [] };

        GraphSnapshot modelGraph = new()
        {
            GraphSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Nodes =
            [
                new GraphNode { NodeId = "shared", NodeType = "model", Label = "model-shared" },
                new GraphNode { NodeId = "target", NodeType = "model", Label = "model-target" },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e-plain",
                    FromNodeId = "shared",
                    ToNodeId = "target",
                    EdgeType = "depends-on",
                },
                new GraphEdge
                {
                    EdgeId = "e-padded",
                    FromNodeId = " shared ",
                    ToNodeId = " target ",
                    EdgeType = " depends-on ",
                },
            ],
        };

        GraphSnapshot merged = GraphSnapshotKnowledgeModelMerger.Merge(contextGraph, modelGraph);

        merged.Edges.Should().ContainSingle();
        merged.Edges[0].EdgeId.Should().Be("e-plain");
    }
}
