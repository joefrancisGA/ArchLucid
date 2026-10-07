using System.Globalization;
using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Core.Diagrams;

namespace ArchLucid.ArtifactSynthesis.Layout;

internal static class DiagramForestEdgeLabelSvgEmitter
{
    private const double LabelFontSize = 11.0d;
    private const double LabelPaddingX = 4.0d;
    private const double LabelPaddingY = 2.0d;
    private const double LabelStackGap = 2.0d;
    private const int MaxLabelStackSteps = 8;

    public static XElement EmitEdgeGroup(
        XNamespace svgNamespace,
        DiagramEdge edge,
        DiagramForestOrthogonalEdgeRouter.RouteResult route,
        bool suppressOnPathLabel,
        bool showArrow,
        List<(double X, double Y, double Width, double Height)> placedLabelBounds,
        IReadOnlyList<string>? bundleFromNodeIds = null,
        IReadOnlyList<string>? bundleToNodeIds = null)
    {
        ArgumentNullException.ThrowIfNull(svgNamespace);
        ArgumentNullException.ThrowIfNull(edge);
        ArgumentNullException.ThrowIfNull(route);
        ArgumentNullException.ThrowIfNull(placedLabelBounds);

        string label = MermaidDiagramRenderer.EscapeLabel(edge.Label).Trim().ToLowerInvariant();
        string title = label.Length == 0 ? "Relationship was not stored" : label;
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

        if (bundleFromNodeIds is { Count: > 0 } && bundleToNodeIds is { Count: > 0 })
        {
            edgeGroup.Add(new XAttribute("data-bundle-from", string.Join(' ', bundleFromNodeIds)));
            edgeGroup.Add(new XAttribute("data-bundle-to", string.Join(' ', bundleToNodeIds)));
        }
        else
        {
            edgeGroup.Add(new XAttribute("data-from", MermaidIdSanitizer.Sanitize(edge.FromNodeId)));
            edgeGroup.Add(new XAttribute("data-to", MermaidIdSanitizer.Sanitize(edge.ToNodeId)));
        }

        edgeGroup.Add(new XAttribute("data-visual-kind", ToVisualKindAttribute(visualKind)));

        List<XAttribute> pathAttributes =
            [
                new XAttribute("d", route.PathData),
                new XAttribute("fill", "none"),
                new XAttribute("stroke", ArchitectureDiagramMermaidPalette.LightEdgeStroke),
                new XAttribute("stroke-width", "1.5"),
                new XAttribute("stroke-linejoin", "round"),
                new XAttribute("vector-effect", "non-scaling-stroke"),
                new XAttribute("class", "edge-path"),
            ];

        if (isPeering)
        {
            pathAttributes.Add(new XAttribute("stroke-dasharray", "6 4"));
        }
        else if (visualKind == DiagramEdgeVisualKind.Declared || visualKind == DiagramEdgeVisualKind.Probable)
        {
            pathAttributes.Add(new XAttribute("stroke-dasharray", "4 3"));
        }
        else if (visualKind == DiagramEdgeVisualKind.AiInferred || visualKind == DiagramEdgeVisualKind.Inferred)
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

        double labelWidth = EstimateLabelWidth(label);
        double labelHeight = LabelFontSize + (LabelPaddingY * 2.0d);
        (double labelX, double labelY) = ResolveLabelAnchor(
            route.Segments,
            labelWidth,
            labelHeight,
            placedLabelBounds);
        placedLabelBounds.Add((labelX, labelY, labelWidth, labelHeight));

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
                new XAttribute("fill", ArchitectureDiagramMermaidPalette.LightEdgeStroke),
                label)));

        return edgeGroup;
    }

    private static (double X, double Y) ResolveLabelAnchor(
        IReadOnlyList<(double X1, double Y1, double X2, double Y2)> segments,
        double labelWidth,
        double labelHeight,
        IReadOnlyList<(double X, double Y, double Width, double Height)> placedLabelBounds)
    {
        (double X1, double Y1, double X2, double Y2) longest = segments
            .OrderByDescending(segment => SegmentLength(segment))
            .First();
        double midX = (longest.X1 + longest.X2) / 2.0d;
        double midY = (longest.Y1 + longest.Y2) / 2.0d;
        double deltaX = longest.X2 - longest.X1;
        double deltaY = longest.Y2 - longest.Y1;
        bool horizontal = Math.Abs(deltaX) >= Math.Abs(deltaY);
        double perpendicularStep = (horizontal ? labelHeight : labelWidth) + LabelStackGap;

        for (int attempt = 0; attempt <= MaxLabelStackSteps; attempt++)
        {
            int direction = attempt == 0
                ? 0
                : ((attempt + 1) / 2) * (attempt % 2 == 1 ? (horizontal ? -1 : 1) : (horizontal ? 1 : -1));
            double candidateX = horizontal ? midX : midX + (direction * perpendicularStep);
            double candidateY = horizontal ? midY + (direction * perpendicularStep) : midY;
            bool collides = placedLabelBounds.Any(placed =>
                RectanglesOverlapOrTouch(
                    candidateX,
                    candidateY,
                    labelWidth,
                    labelHeight,
                    placed.X,
                    placed.Y,
                    placed.Width,
                    placed.Height));

            if (!collides)
            {
                return (candidateX, candidateY);
            }
        }

        int fallbackDirection = MaxLabelStackSteps / 2;
        return horizontal
            ? (midX, midY - (fallbackDirection * perpendicularStep))
            : (midX + (fallbackDirection * perpendicularStep), midY);
    }

    private static double SegmentLength((double X1, double Y1, double X2, double Y2) segment)
    {
        double deltaX = segment.X2 - segment.X1;
        double deltaY = segment.Y2 - segment.Y1;

        return Math.Sqrt((deltaX * deltaX) + (deltaY * deltaY));
    }

    private static bool RectanglesOverlapOrTouch(
        double centerX1,
        double centerY1,
        double width1,
        double height1,
        double centerX2,
        double centerY2,
        double width2,
        double height2)
    {
        return Math.Abs(centerX1 - centerX2) <= (width1 + width2) / 2.0d
            && Math.Abs(centerY1 - centerY2) <= (height1 + height2) / 2.0d;
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
            DiagramEdgeVisualKind.Probable => "probable",
            DiagramEdgeVisualKind.Inferred => "inferred",
            _ => "observed",
        };
}
