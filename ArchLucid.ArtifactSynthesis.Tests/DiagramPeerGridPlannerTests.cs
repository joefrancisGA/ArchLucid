using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramPeerGridPlannerTests
{
    [Theory]
    [InlineData(1, 2)]
    [InlineData(2, 2)]
    [InlineData(3, 3)]
    [InlineData(4, 3)]
    [InlineData(8, 4)]
    [InlineData(11, 5)]
    [InlineData(18, 6)]
    [InlineData(40, 6)]
    public void ResolveColumnCount_matches_viewport_aspect_formula(int nodeCount, int expectedColumns)
    {
        DiagramPeerGridPlanner.ResolveColumnCount(nodeCount).Should().Be(expectedColumns);
    }

    [Fact]
    public void BuildGridLinks_for_eleven_nodes_emits_six_invisible_column_links()
    {
        List<DiagramNode> nodes = Enumerable.Range(0, 11)
            .Select(index => new DiagramNode
            {
                NodeId = $"n{index}",
                Label = $"node-{index}",
                OrderKey = index,
            })
            .ToList();

        IReadOnlyList<DiagramEdge> links = DiagramPeerGridPlanner.BuildGridLinks(nodes);

        links.Should().HaveCount(6);
        links.Should().OnlyContain(link => link.IsLayoutOnly);
        links.Select(link => (link.FromNodeId, link.ToNodeId)).Should().BeEquivalentTo(
        [
            ("n0", "n5"),
            ("n1", "n6"),
            ("n2", "n7"),
            ("n3", "n8"),
            ("n4", "n9"),
            ("n5", "n10"),
        ]);
    }
}
