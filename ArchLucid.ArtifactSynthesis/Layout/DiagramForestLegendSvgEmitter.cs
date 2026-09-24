using System.Globalization;
using System.Security;
using System.Xml.Linq;

using ArchLucid.Core.Diagrams;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>On-canvas legend for inventory-forest SVG export.</summary>
public static class DiagramForestLegendSvgEmitter
{
    private const double RowHeight = 20.0d;
    private const double SwatchWidth = 4.0d;
    private const double SwatchHeight = 12.0d;
    private const double PictogramSize = 16.0d;
    private const double LeftPadding = 10.0d;
    private const double TopPadding = 8.0d;
    private const double BackgroundWidth = 180.0d;

    public sealed record LegendInput(
        IReadOnlyList<DiagramInventoryPictogramKind> UsedKinds,
        bool HasPrivateEndpointAccess,
        bool HasDashedPeeringEdges,
        bool HasResourceGroupFrames);

    public sealed record LegendLayout(
        XElement Group,
        double Width,
        double Height);

    public static LegendLayout Emit(
        XNamespace svgNamespace,
        LegendInput input,
        double anchorX,
        double anchorY)
    {
        ArgumentNullException.ThrowIfNull(svgNamespace);
        ArgumentNullException.ThrowIfNull(input);

        List<string> rows =
        [
            "Legend",
            "Left edge",
        ];

        foreach (DiagramInventoryPictogramKind kind in input.UsedKinds)
        {
            rows.Add(KindLabel(kind));
        }

        if (input.HasPrivateEndpointAccess)
        {
            rows.Add("Private endpoint access");
        }

        rows.Add("Connector");

        if (input.HasDashedPeeringEdges)
        {
            rows.Add("Peering");
        }

        if (input.HasResourceGroupFrames)
        {
            rows.Add("Resource group");
        }

        double height = TopPadding + (rows.Count * RowHeight) + TopPadding;
        XElement group = new(
            svgNamespace + "g",
            new XAttribute("class", "legend"),
            new XAttribute("aria-label", "Diagram legend"),
            new XAttribute(
                "transform",
                string.Create(CultureInfo.InvariantCulture, $"translate({anchorX:0.###},{anchorY:0.###})")));
        group.Add(new XElement(
            svgNamespace + "rect",
            new XAttribute("x", "0"),
            new XAttribute("y", "0"),
            new XAttribute("width", Format(BackgroundWidth)),
            new XAttribute("height", Format(height)),
            new XAttribute("fill", "#ffffff"),
            new XAttribute("stroke", "#e2e8f0"),
            new XAttribute("rx", "4"),
            new XAttribute("pointer-events", "none")));

        double rowY = TopPadding + 11.0d;

        for (int index = 0; index < rows.Count; index++)
        {
            string row = rows[index];
            double y = rowY + (index * RowHeight);

            if (index == 0)
            {
                group.Add(Text(svgNamespace, LeftPadding, y, row, bold: true));
                continue;
            }

            if (string.Equals(row, "Left edge", StringComparison.Ordinal))
            {
                group.Add(Text(svgNamespace, LeftPadding, y, row, bold: false));
                continue;
            }

            if (string.Equals(row, "Private endpoint access", StringComparison.Ordinal))
            {
                group.Add(PrivateEndpointAccessGlyph(svgNamespace, LeftPadding, y - 10.0d));
                group.Add(Text(svgNamespace, LeftPadding + 24.0d, y, row, bold: false));
                continue;
            }

            if (string.Equals(row, "Connector", StringComparison.Ordinal))
            {
                group.Add(SolidLine(svgNamespace, LeftPadding, y - 4.0d));
                group.Add(Text(svgNamespace, LeftPadding + 28.0d, y, row, bold: false));
                continue;
            }

            if (string.Equals(row, "Peering", StringComparison.Ordinal))
            {
                group.Add(DashedLine(svgNamespace, LeftPadding, y - 4.0d));
                group.Add(Text(svgNamespace, LeftPadding + 28.0d, y, row, bold: false));
                continue;
            }

            if (string.Equals(row, "Resource group", StringComparison.Ordinal))
            {
                group.Add(ResourceGroupFrameSwatch(svgNamespace, LeftPadding, y - 9.0d));
                group.Add(Text(svgNamespace, LeftPadding + 28.0d, y, row, bold: false));
                continue;
            }

            DiagramInventoryPictogramKind kind = ParseKindLabel(row);
            group.Add(Swatch(svgNamespace, LeftPadding, y - 9.0d, DiagramInventoryPictogramKindColors.FillFor(kind)));
            group.Add(
                DiagramInventoryPictogramSvgEmitter.Emit(
                    svgNamespace,
                    kind,
                    PictogramSize,
                    LeftPadding + SwatchWidth + 4.0d,
                    y - 12.0d));
            group.Add(Text(svgNamespace, LeftPadding + SwatchWidth + 4.0d + PictogramSize + 6.0d, y, row, bold: false));
        }

        return new LegendLayout(group, BackgroundWidth, height);
    }

    public static IReadOnlyList<DiagramInventoryPictogramKind> CollectUsedKinds(
        IReadOnlyList<DiagramForestNodeMetrics> metrics)
    {
        return metrics
            .Select(item => item.PictogramKind)
            .Distinct()
            .OrderBy(kind => kind)
            .ToList();
    }

    private static string KindLabel(DiagramInventoryPictogramKind kind)
    {
        return kind switch
        {
            DiagramInventoryPictogramKind.Compute => "Compute",
            DiagramInventoryPictogramKind.Network => "Network",
            DiagramInventoryPictogramKind.Data => "Data",
            DiagramInventoryPictogramKind.Storage => "Storage",
            DiagramInventoryPictogramKind.Identity => "Identity",
            _ => "Generic",
        };
    }

    private static DiagramInventoryPictogramKind ParseKindLabel(string label)
    {
        return Enum.TryParse(label, ignoreCase: true, out DiagramInventoryPictogramKind kind)
            ? kind
            : DiagramInventoryPictogramKind.Generic;
    }

    private static XElement Swatch(XNamespace svgNamespace, double x, double y, string fill)
    {
        return new XElement(
            svgNamespace + "rect",
            new XAttribute("x", Format(x)),
            new XAttribute("y", Format(y)),
            new XAttribute("width", Format(SwatchWidth)),
            new XAttribute("height", Format(SwatchHeight)),
            new XAttribute("fill", fill),
            new XAttribute("pointer-events", "none"));
    }

    private static XElement SolidLine(XNamespace svgNamespace, double x, double y)
    {
        return new XElement(
            svgNamespace + "line",
            new XAttribute("x1", Format(x)),
            new XAttribute("y1", Format(y)),
            new XAttribute("x2", Format(x + 24.0d)),
            new XAttribute("y2", Format(y)),
            new XAttribute("stroke", ArchitectureDiagramMermaidPalette.LightEdgeStroke),
            new XAttribute("stroke-width", "1.5"),
            new XAttribute("pointer-events", "none"));
    }

    private static XElement ResourceGroupFrameSwatch(XNamespace svgNamespace, double x, double y)
    {
        return new XElement(
            svgNamespace + "rect",
            new XAttribute("x", Format(x)),
            new XAttribute("y", Format(y)),
            new XAttribute("width", "16"),
            new XAttribute("height", "10"),
            new XAttribute("fill", DiagramForestResourceGroupFrameStyle.Fill),
            new XAttribute("stroke", DiagramForestResourceGroupFrameStyle.Stroke),
            new XAttribute("stroke-width", "2"),
            new XAttribute("rx", "2"),
            new XAttribute("pointer-events", "none"));
    }

    private static XElement DashedLine(XNamespace svgNamespace, double x, double y)
    {
        return new XElement(
            svgNamespace + "line",
            new XAttribute("x1", Format(x)),
            new XAttribute("y1", Format(y)),
            new XAttribute("x2", Format(x + 24.0d)),
            new XAttribute("y2", Format(y)),
            new XAttribute("stroke", ArchitectureDiagramMermaidPalette.LightEdgeStroke),
            new XAttribute("stroke-width", "1.5"),
            new XAttribute("stroke-dasharray", "6 4"),
            new XAttribute("pointer-events", "none"));
    }

    private static XElement PrivateEndpointAccessGlyph(XNamespace svgNamespace, double x, double y)
    {
        return DiagramForestPrivateEndpointAccessSvgEmitter.Emit(
            svgNamespace,
            x,
            y,
            12.0d);
    }

    private static XElement Text(XNamespace svgNamespace, double x, double y, string value, bool bold)
    {
        return new XElement(
            svgNamespace + "text",
            new XAttribute("x", Format(x)),
            new XAttribute("y", Format(y)),
            new XAttribute("font-size", bold ? "11" : "10"),
            new XAttribute("font-weight", bold ? "700" : "400"),
            new XAttribute("font-family", "system-ui,sans-serif"),
            new XAttribute("fill", ArchitectureDiagramMermaidPalette.LightNodeCaption),
            Escape(value));
    }

    private static string Escape(string value)
    {
        return SecurityElement.Escape(value) ?? string.Empty;
    }

    private static string Format(double value)
    {
        return value.ToString("0.###", CultureInfo.InvariantCulture);
    }
}
