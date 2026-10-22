using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class GraphSnapshotExtensionsTests
{
    [Fact]
    public void GetOutgoingTargets_resolves_target_when_edge_to_node_id_has_surrounding_whitespace()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode { NodeId = "a", NodeType = "SecurityBaseline", Label = "sec" },
                new GraphNode { NodeId = "t", NodeType = "TopologyResource", Label = "net" },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e1",
                    FromNodeId = "a",
                    ToNodeId = " t ",
                    EdgeType = "PROTECTS",
                    Label = "protects",
                },
            ],
        };

        graph.GetOutgoingTargets("a", "PROTECTS").Should().ContainSingle()
            .Which.NodeId.Should().Be("t");
    }

    [Fact]
    public void GetIncomingSources_resolves_source_when_edge_from_node_id_has_surrounding_whitespace()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode { NodeId = "a", NodeType = "SecurityBaseline", Label = "sec" },
                new GraphNode { NodeId = "t", NodeType = "TopologyResource", Label = "net" },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e1",
                    FromNodeId = " a ",
                    ToNodeId = "t",
                    EdgeType = "PROTECTS",
                    Label = "protects",
                },
            ],
        };

        graph.GetIncomingSources("t", "PROTECTS").Should().ContainSingle()
            .Which.NodeId.Should().Be("a");
    }

    [Fact]
    public void GetOutgoingTargets_resolves_target_when_edge_type_has_surrounding_whitespace()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode { NodeId = "a", NodeType = "SecurityBaseline", Label = "sec" },
                new GraphNode { NodeId = "t", NodeType = "TopologyResource", Label = "net" },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e1",
                    FromNodeId = "a",
                    ToNodeId = "t",
                    EdgeType = " PROTECTS ",
                    Label = "protects",
                },
            ],
        };

        graph.GetOutgoingTargets("a", "PROTECTS").Should().ContainSingle()
            .Which.NodeId.Should().Be("t");
    }

    [Fact]
    public void GetEdgesByType_resolves_edges_when_stored_edge_type_has_surrounding_whitespace()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode { NodeId = "a", NodeType = "SecurityBaseline", Label = "sec" },
                new GraphNode { NodeId = "t", NodeType = "TopologyResource", Label = "net" },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e1",
                    FromNodeId = "a",
                    ToNodeId = "t",
                    EdgeType = " protects ",
                    Label = "protects",
                },
            ],
        };

        graph.GetEdgesByType("PROTECTS").Should().ContainSingle()
            .Which.EdgeId.Should().Be("e1");
    }
}
