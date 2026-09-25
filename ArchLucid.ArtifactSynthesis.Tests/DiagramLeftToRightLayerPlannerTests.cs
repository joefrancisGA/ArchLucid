using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramLeftToRightLayerPlannerTests
{
    [Fact]
    public void ShouldLayoutLeftToRight_is_false_for_peering_pairs_and_triples()
    {
        DiagramLeftToRightLayerPlanner.ShouldLayoutLeftToRight([Node("a", 0), Node("b", 1)]).Should().BeFalse();
        DiagramLeftToRightLayerPlanner.ShouldLayoutLeftToRight(
            [Node("a", 0), Node("b", 1), Node("c", 2)]).Should().BeFalse();
    }

    [Fact]
    public void AssignLayers_uncrosses_adjacent_rank_edges_by_reordering_within_ranks()
    {
        List<DiagramNode> nodes =
        [
            Node("a", 0),
            Node("b", 1),
            Node("c", 0),
            Node("d", 1),
        ];
        List<DiagramEdge> edges =
        [
            Edge("a", "d"),
            Edge("b", "c"),
        ];

        IReadOnlyList<IReadOnlyList<DiagramNode>> layers = DiagramLeftToRightLayerPlanner.AssignLayers(nodes, edges);

        layers.Should().HaveCount(2);
        CountStraightCrossings(layers[0], layers[1], edges).Should().Be(0);
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

    [Fact]
    public void AssignLayers_places_a_chain_in_increasing_ranks()
    {
        List<DiagramNode> chain =
        [
            Node("a", 0),
            Node("b", 1),
            Node("c", 2),
            Node("d", 3),
            Node("e", 4),
        ];
        List<DiagramEdge> edges =
        [
            Edge("a", "b"),
            Edge("b", "c"),
            Edge("c", "d"),
            Edge("d", "e"),
        ];

        IReadOnlyList<IReadOnlyList<DiagramNode>> layers = DiagramLeftToRightLayerPlanner.AssignLayers(chain, edges);

        layers.Should().HaveCount(5);
        layers[0].Single().NodeId.Should().Be("a");
        layers[4].Single().NodeId.Should().Be("e");
    }

    private static DiagramNode Node(string id, int order)
    {
        return new DiagramNode
        {
            NodeId = id,
            Label = id,
            OrderKey = order,
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
