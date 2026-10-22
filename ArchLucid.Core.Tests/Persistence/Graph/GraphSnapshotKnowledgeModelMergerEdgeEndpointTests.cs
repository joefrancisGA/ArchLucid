using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Persistence.Graph;

[Trait("Category", "Unit")]
public sealed class GraphSnapshotKnowledgeModelMergerEdgeEndpointTests
{
    [Fact]
    public void Merge_canonicalizes_context_edge_endpoints_when_model_node_id_is_trimmed()
    {
        GraphSnapshot contextGraph = new()
        {
            Nodes =
            [
                new GraphNode { NodeId = "ctx-only", NodeType = "context", Label = "context-only" },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e-padded-from",
                    FromNodeId = " shared ",
                    ToNodeId = "ctx-only",
                    EdgeType = "depends-on",
                },
            ],
        };

        GraphSnapshot modelGraph = new()
        {
            GraphSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Nodes =
            [
                new GraphNode { NodeId = "shared", NodeType = "model", Label = "model-shared" },
            ],
        };

        GraphSnapshot merged = GraphSnapshotKnowledgeModelMerger.Merge(contextGraph, modelGraph);

        merged.Nodes.Should().ContainSingle(node => node.NodeId == "shared");
        merged.Edges.Should().ContainSingle();
        merged.Edges[0].FromNodeId.Should().Be("shared");
        merged.Edges[0].ToNodeId.Should().Be("ctx-only");
    }
}
