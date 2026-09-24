using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramLayerCrossingOrderTests
{
    [Fact]
    public void OrderLayer_uncrosses_a_two_by_two_bipartite_swap_fixture()
    {
        DiagramNode nodeA = Node("a", 0);
        DiagramNode nodeB = Node("b", 1);
        DiagramNode nodeC = Node("c", 0);
        DiagramNode nodeD = Node("d", 1);
        List<DiagramNode> leftLayer = [nodeA, nodeB];
        List<DiagramNode> rightLayer = [nodeC, nodeD];
        List<DiagramEdge> edges =
        [
            Edge("a", "d"),
            Edge("b", "c"),
        ];

        List<DiagramNode> orderedLeft = DiagramLayerCrossingOrder.OrderLayer(
            leftLayer,
            previousLayer: null,
            nextLayer: rightLayer,
            edges);
        int crossings = CountStraightCrossings(orderedLeft, rightLayer, edges);

        crossings.Should().Be(0);
    }

    [Fact]
    public void OrderLayer_keeps_order_key_order_when_edges_already_do_not_cross()
    {
        DiagramNode nodeA = Node("a", 0);
        DiagramNode nodeB = Node("b", 1);
        DiagramNode nodeC = Node("c", 0);
        DiagramNode nodeD = Node("d", 1);
        List<DiagramNode> leftLayer = [nodeA, nodeB];
        List<DiagramNode> rightLayer = [nodeC, nodeD];
        List<DiagramEdge> edges =
        [
            Edge("a", "c"),
            Edge("b", "d"),
        ];

        List<DiagramNode> orderedLeft = DiagramLayerCrossingOrder.OrderLayer(
            leftLayer,
            previousLayer: null,
            nextLayer: rightLayer,
            edges);

        orderedLeft.Select(node => node.NodeId).Should().Equal("a", "b");
    }

    [Fact]
    public void OrderByAdjacentLayer_preserves_node_membership()
    {
        DiagramNode nodeA = Node("a", 0);
        DiagramNode nodeB = Node("b", 1);
        DiagramNode nodeC = Node("c", 0);
        List<DiagramNode> layer = [nodeA, nodeB];
        List<DiagramNode> adjacent = [nodeC];
        List<DiagramEdge> edges = [Edge("a", "c"), Edge("b", "c")];

        List<DiagramNode> ordered = DiagramLayerCrossingOrder.OrderByAdjacentLayer(
            layer,
            adjacent,
            adjacentIsPrevious: false,
            otherAdjacentLayer: null,
            edges);

        ordered.Select(node => node.NodeId).Should().BeEquivalentTo(["a", "b"]);
    }

    private static int CountStraightCrossings(
        IReadOnlyList<DiagramNode> leftLayer,
        IReadOnlyList<DiagramNode> rightLayer,
        IReadOnlyList<DiagramEdge> edges)
    {
        Dictionary<string, (double X, double Y)> positions = new(StringComparer.Ordinal);

        for (int index = 0; index < leftLayer.Count; index++)
        {
            positions[leftLayer[index].NodeId] = (0.0d, index + 0.5d);
        }

        for (int index = 0; index < rightLayer.Count; index++)
        {
            positions[rightLayer[index].NodeId] = (1.0d, index + 0.5d);
        }

        List<IReadOnlyList<(double X1, double Y1, double X2, double Y2)>> routes = [];

        foreach (DiagramEdge edge in edges)
        {
            if (!positions.TryGetValue(edge.FromNodeId, out (double FromX, double FromY) fromPosition)
                || !positions.TryGetValue(edge.ToNodeId, out (double ToX, double ToY) toPosition))
            {
                continue;
            }

            routes.Add([(fromPosition.FromX, fromPosition.FromY, toPosition.ToX, toPosition.ToY)]);
        }

        return DiagramEdgeCrossingCounter.Count(routes);
    }

    private static DiagramNode Node(string id, int orderKey)
    {
        return new DiagramNode
        {
            NodeId = id,
            Label = id,
            OrderKey = orderKey,
        };
    }

    private static DiagramEdge Edge(string fromId, string toId)
    {
        return new DiagramEdge
        {
            FromNodeId = fromId,
            ToNodeId = toId,
            Label = "connects",
        };
    }
}
