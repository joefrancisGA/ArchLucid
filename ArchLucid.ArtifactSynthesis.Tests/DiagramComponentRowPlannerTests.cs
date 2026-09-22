using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramComponentRowPlannerTests
{
    [Theory]
    [InlineData(1, 1)]
    [InlineData(2, 2)]
    [InlineData(5, 3)]
    [InlineData(9, 3)]
    [InlineData(16, 4)]
    [InlineData(17, 4)]
    public void ResolveColumnCount_uses_square_root_clamped_to_two_through_four(int componentCount, int expected)
    {
        DiagramComponentRowPlanner.ResolveColumnCount(componentCount).Should().Be(expected);
    }

    [Fact]
    public void BuildAlignmentLinks_owner_five_components_uses_three_columns_and_pins_leftover_heads_under_triple_sink()
    {
        List<List<DiagramNode>> components = BuildOwnerComponents();
        List<DiagramEdge> visibleEdges = BuildOwnerVisibleEdges();

        IReadOnlyList<DiagramEdge> links = DiagramComponentRowPlanner.BuildAlignmentLinks(components, visibleEdges);

        DiagramComponentRowPlanner.ResolveColumnCount(components.Count).Should().Be(3);
        links.Should().OnlyContain(edge => edge.IsLayoutOnly);
        links.Should().HaveCountGreaterThanOrEqualTo(2);

        string eastusOneId = NodeId("vnet-eastus-1");
        links.Count(edge => string.Equals(edge.FromNodeId, eastusOneId, StringComparison.Ordinal))
            .Should()
            .BeGreaterThanOrEqualTo(2);

        DiagramComponentRowPlanner.ResolveSinkNodeId(components[0], visibleEdges).Should().Be(eastusOneId);
        DiagramComponentRowPlanner.ResolveHeadNodeId(components[0]).Should().Be(NodeId("vnet-aep-hi-test-wus-001"));
    }

    [Fact]
    public void BuildAlignmentLinks_single_component_returns_empty()
    {
        List<DiagramNode> only = [Node("a", 0), Node("b", 1)];
        List<DiagramEdge> edges =
        [
            new DiagramEdge { FromNodeId = "a", ToNodeId = "b", Label = "peering" },
        ];

        DiagramComponentRowPlanner.BuildAlignmentLinks([only], edges).Should().BeEmpty();
    }

    private static List<List<DiagramNode>> BuildOwnerComponents()
    {
        return
        [
            [
                Node("vnet-aep-hi-test-wus-001", 0),
                Node("vnet-edw-hi-nprd-wus-001", 6),
                Node("vnet-eastus-1", 4),
            ],
            [
                Node("vnet-avd-hi-nprd", 2),
                Node("vnet-edw-hi-ppd", 7),
            ],
            [
                Node("vnet-avd-hi-nonprod01", 1),
                Node("vnet-edw-hi-tst", 8),
            ],
            [
                Node("vnet-eastus", 3),
                Node("vnet-pcoe-hi-nprd", 9),
            ],
            [
                Node("vnet-edw-hi-dev", 5),
                Node("vnet-userprovision-hi-nonprod01", 10),
            ],
        ];
    }

    private static List<DiagramEdge> BuildOwnerVisibleEdges()
    {
        return
        [
            Visible(NodeId("vnet-aep-hi-test-wus-001"), NodeId("vnet-edw-hi-nprd-wus-001")),
            Visible(NodeId("vnet-edw-hi-nprd-wus-001"), NodeId("vnet-eastus-1")),
            Visible(NodeId("vnet-avd-hi-nprd"), NodeId("vnet-edw-hi-ppd")),
            Visible(NodeId("vnet-avd-hi-nonprod01"), NodeId("vnet-edw-hi-tst")),
            Visible(NodeId("vnet-eastus"), NodeId("vnet-pcoe-hi-nprd")),
            Visible(NodeId("vnet-edw-hi-dev"), NodeId("vnet-userprovision-hi-nonprod01")),
        ];
    }

    private static DiagramNode Node(string label, int orderKey)
    {
        return new DiagramNode
        {
            NodeId = NodeId(label),
            Label = label,
            OrderKey = orderKey,
        };
    }

    private static DiagramEdge Visible(string fromId, string toId)
    {
        return new DiagramEdge
        {
            FromNodeId = fromId,
            ToNodeId = toId,
            Label = "peering",
        };
    }

    private static string NodeId(string label)
    {
        return label;
    }
}
