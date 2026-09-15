using System.Globalization;
using System.Security;
using System.Xml.Linq;

using ArchLucid.Core.Diagrams;

namespace ArchLucid.ArtifactSynthesis.Layout;

public static class DiagramForestNodeSvgEmitter
{
    public static XElement Emit(
        XNamespace svgNamespace,
        string nodeId,
        double width,
        double height,
        DiagramForestNodeMetrics metrics,
        DiagramForestLayoutOptions options)
    {
        ArgumentNullException.ThrowIfNull(svgNamespace);
        ArgumentNullException.ThrowIfNull(metrics);
        ArgumentNullException.ThrowIfNull(options);

        XElement group = new(
            svgNamespace + "g",
            new XAttribute("class", "node"),
            new XAttribute("id", $"node-{nodeId}"));
        group.Add(new XElement(svgNamespace + "title", Escape(metrics.Caption.AccessibilityTitle)));
        group.Add(new XElement(
            svgNamespace + "rect",
            new XAttribute("width", Format(width)),
            new XAttribute("height", Format(height)),
            new XAttribute("fill", ArchitectureDiagramMermaidPalette.LightNodeFill),
            new XAttribute("stroke", ArchitectureDiagramMermaidPalette.LightNodeBorder),
            new XAttribute("stroke-width", "1.5"),
            new XAttribute("rx", "4"),
            new XAttribute("pointer-events", "all")));

        double pictogramX = (width - options.PictogramSize) / 2.0;
        group.Add(
            DiagramInventoryPictogramSvgEmitter.Emit(
                svgNamespace,
                metrics.PictogramKind,
                options.PictogramSize,
                pictogramX,
                options.NodePaddingY));

        double textY = options.NodePaddingY + options.PictogramSize + options.IconToLabelGap + (options.LineHeight * 0.75);
        XElement text = new(
            svgNamespace + "text",
            new XAttribute("x", Format(width / 2.0)),
            new XAttribute("y", Format(textY)),
            new XAttribute("text-anchor", "middle"),
            new XAttribute("font-size", "12"),
            new XAttribute("font-weight", "700"),
            new XAttribute("font-family", "system-ui,sans-serif"),
            new XAttribute("fill", "#0f172a"));

        for (int index = 0; index < metrics.NameLines.Count; index++)
        {
            string line = metrics.NameLines[index];
            XElement tspan = new(
                svgNamespace + "tspan",
                new XAttribute("x", Format(width / 2.0)),
                Escape(line));

            if (index > 0)
            {
                tspan.Add(new XAttribute("dy", Format(options.LineHeight)));
            }

            text.Add(tspan);
        }

        group.Add(text);

        return group;
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
