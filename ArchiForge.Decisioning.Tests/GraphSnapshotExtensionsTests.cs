using ArchiForge.KnowledgeGraph.Models;
using FluentAssertions;

namespace ArchiForge.Decisioning.Tests;

public sealed class GraphSnapshotExtensionsTests
{
    [Fact]
    public void GetIncomingSources_returns_nodes_with_edges_to_target()
    {
        var graph = new GraphSnapshot
        {
            Nodes =
            [
                new GraphNode { NodeId = "a", NodeType = "SecurityBaseline", Label = "sec", Properties = new() },
                new GraphNode { NodeId = "t", NodeType = "TopologyResource", Label = "net", Properties = new() }
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e1",
                    FromNodeId = "a",
                    ToNodeId = "t",
                    EdgeType = "PROTECTS",
                    Label = "protects"
                }
            ]
        };

        var sources = graph.GetIncomingSources("t", "PROTECTS");

        sources.Should().ContainSingle();
        sources[0].NodeId.Should().Be("a");
    }
}
