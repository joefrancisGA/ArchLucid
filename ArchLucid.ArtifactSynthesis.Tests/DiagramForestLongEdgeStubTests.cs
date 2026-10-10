using System.Globalization;
using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramForestLongEdgeStubTests
{
    private static readonly XNamespace Svg = "http://www.w3.org/2000/svg";

    [Fact]
    public void CountCrossedRows_is_greater_than_two_when_endpoints_span_five_rows()
    {
        IReadOnlyList<DiagramForestLongEdgeStub.RowBand> bands = DiagramForestLongEdgeStub.BuildRowBands(
        [
            (0, 20),
            (100, 20),
            (200, 20),
            (300, 20),
            (400, 20),
        ]);

        int crossed = DiagramForestLongEdgeStub.CountCrossedRows(10, 410, bands);

        crossed.Should().BeGreaterThan(DiagramForestLongEdgeStub.MaxFullLineCrossedRows);
        DiagramForestLongEdgeStub.ShouldStub(10, 410, bands).Should().BeTrue();
    }

    [Fact]
    public void CountCrossedRows_keeps_a_full_line_when_exactly_two_rows_lie_between_the_ends()
    {
        IReadOnlyList<DiagramForestLongEdgeStub.RowBand> bands = DiagramForestLongEdgeStub.BuildRowBands(
        [
            (0, 20),
            (100, 20),
            (200, 20),
            (300, 20),
        ]);

        DiagramForestLongEdgeStub.CountCrossedRows(10, 310, bands).Should().Be(2);
        DiagramForestLongEdgeStub.ShouldStub(10, 310, bands).Should().BeFalse();
    }

    [Fact]
    public void Emit_draws_two_named_stubs_no_taller_than_the_node_gap()
    {
        double gap = new DiagramForestLayoutOptions().NodeHorizontalGap;
        IReadOnlyList<XElement> stubs = DiagramForestLongEdgeStub.Emit(
            Svg,
            new DiagramEdge
            {
                FromNodeId = "alpha",
                ToNodeId = "beta",
                Label = "used by",
            },
            [(40, 10, 40, 410)],
            "alpha",
            "beta",
            "alpha",
            "beta",
            gap);

        stubs.Should().HaveCount(2);
        stubs.Select(stub => stub.Attribute("class")?.Value).Should().AllBe("edge-stub");
        string[] chips = stubs
            .Select(stub => stub.Elements(Svg + "text").Single().Value)
            .ToArray();
        chips.Should().Contain(chip => chip.StartsWith("→ ", StringComparison.Ordinal));
        chips.Should().Contain(chip => chip.StartsWith("← ", StringComparison.Ordinal));
        stubs.Select(VerticalSpan).Should().OnlyContain(span => span <= gap);
        stubs[0].Attribute("data-focus-node")?.Value.Should().Be("beta");
        stubs[1].Attribute("data-focus-node")?.Value.Should().Be("alpha");
        stubs[0].Element(Svg + "title")?.Value.Should().Be("used by → beta");
    }

    [Fact]
    public void Render_adjacent_used_by_edge_stays_a_full_line()
    {
        DiagramForestLayoutResult result = new DiagramForestLayoutSvgRenderer().Render(new DiagramAst
        {
            Title = "adjacent",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "alpha",
                    Label = "alpha",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "beta",
                    Label = "beta",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    OrderKey = 1,
                },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "alpha",
                    ToNodeId = "beta",
                    Label = "used by",
                },
            ],
        });

        result.Succeeded.Should().BeTrue();
        result.Svg.Should().Contain("edge-path");
        result.Svg.Should().NotContain("edge-stub");
    }

    private static double VerticalSpan(XElement stub)
    {
        string path = stub.Elements(Svg + "path").Single().Attribute("d")?.Value ?? string.Empty;
        string[] parts = path.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        double startY = double.Parse(parts[2], CultureInfo.InvariantCulture);
        double endY = parts[3] == "V"
            ? double.Parse(parts[4], CultureInfo.InvariantCulture)
            : startY;
        return Math.Abs(endY - startY);
    }
}
