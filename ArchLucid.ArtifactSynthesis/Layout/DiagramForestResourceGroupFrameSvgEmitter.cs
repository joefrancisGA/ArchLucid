using System.Globalization;
using System.Security;
using System.Xml.Linq;

using ArchLucid.Core.Diagrams;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Dashed resource-group frames around packed forest node groups.</summary>
public static class DiagramForestResourceGroupFrameSvgEmitter
{
    public static XElement EmitLayer(
        XNamespace svgNamespace,
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupFrameBounds> frames)
    {
        ArgumentNullException.ThrowIfNull(svgNamespace);
        ArgumentNullException.ThrowIfNull(frames);

        XElement layer = new(svgNamespace + "g", new XAttribute("class", "rg-frames"));

        foreach (DiagramResourceGroupPacker.ResourceGroupFrameBounds frame in frames)
        {
            layer.Add(new XElement(
                svgNamespace + "g",
                new XAttribute("class", "rg-frame"),
                new XElement(
                    svgNamespace + "rect",
                    new XAttribute("x", Format(frame.X)),
                    new XAttribute("y", Format(frame.Y)),
                    new XAttribute("width", Format(frame.Width)),
                    new XAttribute("height", Format(frame.Height)),
                    new XAttribute("fill", "#f1f5f9"),
                    new XAttribute("fill-opacity", "0.5"),
                    new XAttribute("stroke", ArchitectureDiagramMermaidPalette.LightEdgeStroke),
                    new XAttribute("stroke-dasharray", "5 4"),
                    new XAttribute("rx", "8"),
                    new XAttribute("pointer-events", "none")),
                new XElement(
                    svgNamespace + "text",
                    new XAttribute("class", "clusterLabelText"),
                    new XAttribute("x", Format(frame.X)),
                    new XAttribute("y", Format(frame.Y - 4)),
                    new XAttribute("text-anchor", "start"),
                    new XAttribute("font-size", "11"),
                    new XAttribute("font-weight", "700"),
                    new XAttribute("font-family", "system-ui,sans-serif"),
                    new XAttribute("fill", ArchitectureDiagramMermaidPalette.LightNodeCaption),
                    Escape(frame.GroupName))));
        }

        return layer;
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
