using ArchLucid.ArtifactSynthesis.Compilers;
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
