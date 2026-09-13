using System.Globalization;
using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;

namespace ArchLucid.ArtifactSynthesis.Layout;

internal static class DiagramForestEdgeLabelSvgEmitter
{
    private const double LabelFontSize = 11.0d;
    private const double LabelPaddingX = 4.0d;
    private const double LabelPaddingY = 2.0d;
    private const double LabelOffset = 8.0d;

    public static XElement EmitEdgeGroup(
        XNamespace svgNamespace,
        DiagramEdge edge,
        double fromX,
        double fromY,
        double toX,
        double toY)
    {
        XElement edgeGroup = new(
            svgNamespace + "g",
            new XAttribute("class", "edge"),
            new XElement(
                svgNamespace + "line",
                new XAttribute("x1", FormatCoordinate(fromX)),
                new XAttribute("y1", FormatCoordinate(fromY)),
                new XAttribute("x2", FormatCoordinate(toX)),
                new XAttribute("y2", FormatCoordinate(toY)),
                new XAttribute("stroke", "#64748b"),
                new XAttribute("stroke-width", "1.5")));

        string label = MermaidDiagramRenderer.EscapeLabel(edge.Label).Trim();

        if (label.Length == 0)
        {
            return edgeGroup;
        }

        (double labelX, double labelY) = ResolveLabelAnchor(fromX, fromY, toX, toY);
        double labelWidth = EstimateLabelWidth(label);
        double labelHeight = LabelFontSize + (LabelPaddingY * 2.0d);

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
        double fromX,
        double fromY,
        double toX,
        double toY)
    {
        double midX = (fromX + toX) / 2.0d;
        double midY = (fromY + toY) / 2.0d;
        double deltaX = toX - fromX;
        double deltaY = toY - fromY;

        if (Math.Abs(deltaX) >= Math.Abs(deltaY))
        {
            return (midX, midY - LabelOffset);
        }

        return (midX + LabelOffset, midY);
    }

    private static double EstimateLabelWidth(string label)
    {
        return (label.Length * 6.4d) + (LabelPaddingX * 2.0d);
    }

    private static string FormatCoordinate(double value)
    {
        return value.ToString("0.###", CultureInfo.InvariantCulture);
    }
}
