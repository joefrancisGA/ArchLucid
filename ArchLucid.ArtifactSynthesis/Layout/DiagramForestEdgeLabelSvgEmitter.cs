using System.Globalization;
using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Core.Diagrams;

namespace ArchLucid.ArtifactSynthesis.Layout;

internal static class DiagramForestEdgeLabelSvgEmitter
{
    private const double LabelFontSize = 11.0d;
    private const double LabelPaddingX = 4.0d;
    private const double LabelPaddingY = 2.0d;
    private const double LabelOffset = 10.0d;
    private const double LabelCollisionRadius = 12.0d;
    private const double LabelNudge = 14.0d;

    public static XElement EmitEdgeGroup(
        XNamespace svgNamespace,
        DiagramEdge edge,
        DiagramForestOrthogonalEdgeRouter.RouteResult route,
        bool suppressOnPathLabel,
        bool showArrow,
        List<(double X, double Y)> placedLabelCenters)
    {
        ArgumentNullException.ThrowIfNull(svgNamespace);
        ArgumentNullException.ThrowIfNull(edge);
        ArgumentNullException.ThrowIfNull(route);
        ArgumentNullException.ThrowIfNull(placedLabelCenters);

        string label = MermaidDiagramRenderer.EscapeLabel(edge.Label).Trim();
        string title = label.Length == 0 ? "connector" : label;
        bool isPeering = DiagramForestEdgeLabelCollapse.IsPeeringEdge(edge);
        DiagramEdgeVisualKind visualKind = DiagramEdgeVisualKindResolver.From(edge.ProvenanceKind, edge.InferenceSource);

        XElement edgeGroup = new(
            svgNamespace + "g",
            new XAttribute("class", "edge"),
            new XElement(svgNamespace + "title", title));

        if (!string.IsNullOrWhiteSpace(edge.ProvenanceKind))
        {
            edgeGroup.Add(new XAttribute("data-provenance", edge.ProvenanceKind));
        }

        if (!string.IsNullOrWhiteSpace(edge.InferenceSource))
        {
            edgeGroup.Add(new XAttribute("data-inference", edge.InferenceSource));
        }

        edgeGroup.Add(new XAttribute("data-visual-kind", ToVisualKindAttribute(visualKind)));

        List<XAttribute> pathAttributes =
            [
                new XAttribute("d", route.PathData),
                new XAttribute("fill", "none"),
                new XAttribute("stroke", ArchitectureDiagramMermaidPalette.LightEdgeStroke),
                new XAttribute("stroke-width", "1.5"),
                new XAttribute("stroke-linejoin", "round"),
                new XAttribute("class", "edge-path"),
            ];

        if (isPeering)
        {
            pathAttributes.Add(new XAttribute("stroke-dasharray", "6 4"));
        }
        else if (visualKind == DiagramEdgeVisualKind.Declared)
        {
            pathAttributes.Add(new XAttribute("stroke-dasharray", "4 3"));
        }
        else if (visualKind == DiagramEdgeVisualKind.AiInferred)
        {
            pathAttributes.Add(new XAttribute("stroke-dasharray", "1 3"));
        }

        if (showArrow)
        {
            pathAttributes.Add(new XAttribute(
                "marker-end",
                $"url(#{DiagramForestEdgeArrowMarkerSvgEmitter.MarkerId})"));
        }

        edgeGroup.Add(new XElement(svgNamespace + "path", pathAttributes));

        if (suppressOnPathLabel || label.Length == 0)
        {
            return edgeGroup;
        }

        (double labelX, double labelY) = ResolveLabelAnchor(route.Segments, placedLabelCenters);
        double labelWidth = EstimateLabelWidth(label);
        double labelHeight = LabelFontSize + (LabelPaddingY * 2.0d);
        placedLabelCenters.Add((labelX, labelY));

        edgeGroup.Add(new XElement(
            svgNamespace + "g",
            new XAttribute("class", "edge-label"),
            new XElement(
                svgNamespace + "rect",
                new XAttribute("x", FormatCoordinate(labelX - (labelWidth / 2.0d))),
                new XAttribute("y", FormatCoordinate(labelY - (labelHeight / 2.0d))),
                new XAttribute("width", FormatCoordinate(labelWidth)),
                new XAttribute("height", FormatCoordinate(labelHeight)),
                new XAttribute("rx", "3"),
                new XAttribute("fill", "#ffffff"),
                new XAttribute("stroke", "#cbd5e1"),
                new XAttribute("stroke-width", "1")),
            new XElement(
                svgNamespace + "text",
                new XAttribute("x", FormatCoordinate(labelX)),
                new XAttribute("y", FormatCoordinate(labelY)),
                new XAttribute("text-anchor", "middle"),
                new XAttribute("dominant-baseline", "middle"),
                new XAttribute("font-size", FormatCoordinate(LabelFontSize)),
                new XAttribute("font-family", "system-ui, sans-serif"),
                new XAttribute("fill", "#334155"),
                label)));

        return edgeGroup;
    }

    private static (double X, double Y) ResolveLabelAnchor(
        IReadOnlyList<(double X1, double Y1, double X2, double Y2)> segments,
        List<(double X, double Y)> placedLabelCenters)
    {
        (double X1, double Y1, double X2, double Y2) longest = segments
            .OrderByDescending(segment => SegmentLength(segment))
            .First();
        double midX = (longest.X1 + longest.X2) / 2.0d;
        double midY = (longest.Y1 + longest.Y2) / 2.0d;
        double deltaX = longest.X2 - longest.X1;
        double deltaY = longest.Y2 - longest.Y1;
        double offsetX = 0.0d;
        double offsetY = 0.0d;

        if (Math.Abs(deltaX) >= Math.Abs(deltaY))
        {
            offsetY = -LabelOffset;
        }
        else
        {
            offsetX = LabelOffset;
        }

        for (int attempt = 0; attempt < 5; attempt++)
        {
            double candidateX = midX + offsetX;
            double candidateY = midY + offsetY;
            bool collides = placedLabelCenters.Any(center =>
                Distance(center.X, center.Y, candidateX, candidateY) < LabelCollisionRadius);

            if (!collides)
            {
                return (candidateX, candidateY);
            }

            if (Math.Abs(deltaX) >= Math.Abs(deltaY))
            {
                midX += LabelNudge * Math.Sign(deltaX == 0 ? 1 : deltaX);
            }
            else
            {
                midY += LabelNudge * Math.Sign(deltaY == 0 ? 1 : deltaY);
            }
        }

        return (midX + offsetX, midY + offsetY);
    }

    private static double SegmentLength((double X1, double Y1, double X2, double Y2) segment)
    {
        double deltaX = segment.X2 - segment.X1;
        double deltaY = segment.Y2 - segment.Y1;

        return Math.Sqrt((deltaX * deltaX) + (deltaY * deltaY));
    }

    private static double Distance(double x1, double y1, double x2, double y2)
    {
        double deltaX = x2 - x1;
        double deltaY = y2 - y1;

        return Math.Sqrt((deltaX * deltaX) + (deltaY * deltaY));
    }

    private static double EstimateLabelWidth(string label)
    {
        return (label.Length * 6.4d) + (LabelPaddingX * 2.0d);
    }

    private static string FormatCoordinate(double value)
    {
        return value.ToString("0.###", CultureInfo.InvariantCulture);
    }

    private static string ToVisualKindAttribute(DiagramEdgeVisualKind visualKind) =>
        visualKind switch
        {
            DiagramEdgeVisualKind.Declared => "declared",
            DiagramEdgeVisualKind.AiInferred => "ai-inferred",
            _ => "observed",
        };
}
