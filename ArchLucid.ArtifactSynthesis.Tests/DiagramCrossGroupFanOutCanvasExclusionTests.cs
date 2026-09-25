using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramCrossGroupFanOutCanvasExclusionTests
{
    private readonly DiagramForestLayoutSvgRenderer renderer = new();

    [Fact]
    public void Render_default_hides_cross_group_likely_applies_but_keeps_same_group_and_connects()
    {
        DiagramAst ast = BuildTwoResourceGroupAst();

        DiagramForestLayoutResult result = renderer.Render(ast);

        result.Succeeded.Should().BeTrue();
        result.Svg.Should().Contain("likely · in");
        result.Svg.Should().NotContain("likely · applies");
        result.Svg.Should().Contain("connects");
    }

    [Fact]
    public void Render_with_include_cross_group_fan_out_paints_likely_applies_edge()
    {
        DiagramAst ast = BuildTwoResourceGroupAst();

        DiagramForestLayoutResult result = renderer.Render(
            ast,
            new DiagramForestLayoutOptions { IncludeCrossGroupFanOut = true });

        result.Succeeded.Should().BeTrue();
        result.Svg.Should().Contain("likely · applies");
    }

    [Fact]
    public void FilterCanvasEdges_excludes_only_cross_group_applies_and_likely_prefix()
    {
        DiagramNode left = Node("left", "rg-a");
        DiagramNode right = Node("right", "rg-b");
        IReadOnlyList<DiagramNode> nodes = [left, right];
        DiagramEdge sameGroupLikely = Edge("left", "left", "likely · in");
        DiagramEdge crossGroupLikely = Edge("left", "right", "likely · applies");
        DiagramEdge crossGroupConnects = Edge("left", "right", "connects");

        IReadOnlyList<DiagramEdge> filtered = DiagramCrossGroupFanOutCanvasExclusion
            .FilterCanvasEdges(nodes, [sameGroupLikely, crossGroupLikely, crossGroupConnects], includeCrossGroupFanOut: false)
            .ToList();

        filtered.Should().Contain(sameGroupLikely);
        filtered.Should().Contain(crossGroupConnects);
        filtered.Should().NotContain(crossGroupLikely);
    }

    private static DiagramAst BuildTwoResourceGroupAst()
    {
        return new DiagramAst
        {
            Title = "Azure inventory (Full)",
            Nodes =
            [
                Node("vm-a1", "rg-a", orderKey: 0),
                Node("vm-a2", "rg-a", orderKey: 1),
                Node("vm-b", "rg-b", orderKey: 2),
            ],
            Edges =
            [
                Edge("vm-a1", "vm-a2", "likely · in"),
                Edge("vm-a1", "vm-b", "likely · applies"),
                Edge("vm-a1", "vm-b", "connects"),
            ],
        };
    }

    private static DiagramNode Node(string nodeId, string resourceGroup, int orderKey = 0)
    {
        return new DiagramNode
        {
            NodeId = nodeId,
            Label = nodeId,
            NodeType = "TopologyResource",
            ArmResourceGroup = resourceGroup,
            OrderKey = orderKey,
        };
    }

    private static DiagramEdge Edge(string fromNodeId, string toNodeId, string label)
    {
        return new DiagramEdge
        {
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            Label = label,
        };
    }
}
