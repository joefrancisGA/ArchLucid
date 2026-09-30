using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramForestEdgeLabelSvgEmitterTests
{
    private static readonly XNamespace Svg = "http://www.w3.org/2000/svg";

    [Fact]
    public void EmitEdgeGroup_centers_first_horizontal_label_on_segment()
    {
        XElement group = Emit(
            "used by",
            new DiagramForestOrthogonalEdgeRouter.RouteResult(
                "M 0 100 H 200",
                [(0, 100, 200, 100)],
                UsedFallback: false));

        (double x, double y) = ReadCenter(group);

        x.Should().Be(100);
        y.Should().Be(100);
    }

    [Fact]
    public void EmitEdgeGroup_stacks_colliding_horizontal_labels_perpendicular_to_segment()
    {
        List<(double X, double Y, double Width, double Height)> placed = [];

        XElement first = Emit(
            "used by",
            new DiagramForestOrthogonalEdgeRouter.RouteResult(
                "M 0 100 H 200",
                [(0, 100, 200, 100)],
                UsedFallback: false),
            placed);
        XElement second = Emit(
            "peering",
            new DiagramForestOrthogonalEdgeRouter.RouteResult(
                "M 0 100 H 200",
                [(0, 100, 200, 100)],
                UsedFallback: false),
            placed);

        (double firstX, double firstY) = ReadCenter(first);
        (double secondX, double secondY) = ReadCenter(second);

        firstX.Should().Be(100);
        firstY.Should().Be(100);
        secondX.Should().Be(100);
        secondY.Should().Be(85);
    }

    [Fact]
    public void EmitEdgeGroup_stacks_colliding_vertical_labels_perpendicular_to_segment()
    {
        List<(double X, double Y, double Width, double Height)> placed = [];

        Emit(
            "used by",
            new DiagramForestOrthogonalEdgeRouter.RouteResult(
                "M 40 0 V 180",
                [(40, 0, 40, 180)],
                UsedFallback: false),
            placed);
        XElement second = Emit(
            "peering",
            new DiagramForestOrthogonalEdgeRouter.RouteResult(
                "M 40 0 V 180",
                [(40, 0, 40, 180)],
                UsedFallback: false),
            placed);

        (double secondX, double secondY) = ReadCenter(second);

        secondX.Should().Be(94.8);
        secondY.Should().Be(90);
    }

    private static XElement Emit(
        string label,
        DiagramForestOrthogonalEdgeRouter.RouteResult route,
        List<(double X, double Y, double Width, double Height)>? placed = null)
    {
        return DiagramForestEdgeLabelSvgEmitter.EmitEdgeGroup(
            Svg,
            new DiagramEdge
            {
                FromNodeId = "from",
                ToNodeId = "to",
                Label = label,
            },
            route,
            suppressOnPathLabel: false,
            showArrow: false,
            placed ??= []);
    }

    private static (double X, double Y) ReadCenter(XElement group)
    {
        XElement text = group
            .Descendants(Svg + "text")
            .Single();

        return (
            double.Parse(text.Attribute("x")!.Value, System.Globalization.CultureInfo.InvariantCulture),
            double.Parse(text.Attribute("y")!.Value, System.Globalization.CultureInfo.InvariantCulture));
    }
}
