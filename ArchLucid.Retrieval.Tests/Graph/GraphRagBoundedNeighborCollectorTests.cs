using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Retrieval.Graph;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests.Graph;

[Trait("Category", "Unit")]
public sealed class GraphRagBoundedNeighborCollectorTests
{
    [Fact]
    public void Collect_returns_one_hop_neighbors_when_max_hops_is_one()
    {
        GraphSnapshot snapshot = BuildLinearChainSnapshot(["a", "b", "c"]);

        IReadOnlyList<GraphRagNeighborHop> neighbors = GraphRagBoundedNeighborCollector.Collect(snapshot, "a", maxHops: 1, maxNeighbors: 8);

        neighbors.Select(hop => hop.Node.NodeId).Should().BeEquivalentTo(["b"]);
        neighbors.Should().OnlyContain(hop => hop.HopDistance == 1);
    }

    [Fact]
    public void Collect_traverses_multi_hop_chain_within_budget()
    {
        GraphSnapshot snapshot = BuildLinearChainSnapshot(["seed", "hop1", "hop2", "hop3"]);

        IReadOnlyList<GraphRagNeighborHop> neighbors = GraphRagBoundedNeighborCollector.Collect(snapshot, "seed", maxHops: 3, maxNeighbors: 8);

        neighbors.Select(hop => hop.Node.NodeId).Should().Equal(["hop1", "hop2", "hop3"]);
        neighbors.Select(hop => hop.HopDistance).Should().Equal([1, 2, 3]);
    }

    [Fact]
    public void Collect_stops_at_hop_budget_before_reaching_chain_end()
    {
        GraphSnapshot snapshot = BuildLinearChainSnapshot(["seed", "hop1", "hop2", "hop3"]);

        IReadOnlyList<GraphRagNeighborHop> neighbors = GraphRagBoundedNeighborCollector.Collect(snapshot, "seed", maxHops: 2, maxNeighbors: 8);

        neighbors.Select(hop => hop.Node.NodeId).Should().Equal(["hop1", "hop2"]);
    }

    [Fact]
    public void Collect_skips_cycle_edges_without_revisiting_nodes()
    {
        GraphSnapshot snapshot = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode { NodeId = "a", NodeType = "TopologyResource", Label = "A" },
                new GraphNode { NodeId = "b", NodeType = "TopologyResource", Label = "B" },
                new GraphNode { NodeId = "c", NodeType = "TopologyResource", Label = "C" },
            ],
            Edges =
            [
                new GraphEdge { FromNodeId = "a", ToNodeId = "b", EdgeType = "CONTAINS" },
                new GraphEdge { FromNodeId = "b", ToNodeId = "c", EdgeType = "CONTAINS" },
                new GraphEdge { FromNodeId = "c", ToNodeId = "a", EdgeType = "PROTECTS" },
            ],
        };

        IReadOnlyList<GraphRagNeighborHop> neighbors = GraphRagBoundedNeighborCollector.Collect(snapshot, "a", maxHops: 4, maxNeighbors: 8);

        neighbors.Select(hop => hop.Node.NodeId).Should().Equal(["b", "c"]);
    }

    [Fact]
    public void Collect_respects_max_neighbors_cap()
    {
        GraphSnapshot snapshot = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode { NodeId = "seed", NodeType = "TopologyResource", Label = "Seed" },
                new GraphNode { NodeId = "n1", NodeType = "TopologyResource", Label = "N1" },
                new GraphNode { NodeId = "n2", NodeType = "TopologyResource", Label = "N2" },
                new GraphNode { NodeId = "n3", NodeType = "TopologyResource", Label = "N3" },
            ],
            Edges =
            [
                new GraphEdge { FromNodeId = "seed", ToNodeId = "n1", EdgeType = "CONTAINS" },
                new GraphEdge { FromNodeId = "seed", ToNodeId = "n2", EdgeType = "CONTAINS" },
                new GraphEdge { FromNodeId = "seed", ToNodeId = "n3", EdgeType = "CONTAINS" },
            ],
        };

        IReadOnlyList<GraphRagNeighborHop> neighbors = GraphRagBoundedNeighborCollector.Collect(snapshot, "seed", maxHops: 1, maxNeighbors: 2);

        neighbors.Should().HaveCount(2);
    }

    private static GraphSnapshot BuildLinearChainSnapshot(IReadOnlyList<string> nodeIds)
    {
        List<GraphNode> nodes = nodeIds
            .Select(id => new GraphNode { NodeId = id, NodeType = "TopologyResource", Label = id })
            .ToList();

        List<GraphEdge> edges = [];

        for (int index = 0; index < nodeIds.Count - 1; index++)
        {
            edges.Add(new GraphEdge
            {
                FromNodeId = nodeIds[index],
                ToNodeId = nodeIds[index + 1],
                EdgeType = "CONTAINS",
            });
        }

        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes = nodes,
            Edges = edges,
        };
    }
}
