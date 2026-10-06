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
}
