using System.Globalization;
using System.Security;
using System.Xml.Linq;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Paints VNet and subnet frames beneath resource-group frames.</summary>
public static class DiagramForestNestedFrameSvgEmitter
{
    public static XElement EmitLayer(
        XNamespace svgNamespace,
        IReadOnlyList<DiagramForestNestedFrameBounds> frames)
    {
        ArgumentNullException.ThrowIfNull(svgNamespace);
        ArgumentNullException.ThrowIfNull(frames);

        XElement layer = new(svgNamespace + "g", new XAttribute("class", "nested-frames"));

        foreach (DiagramForestNestedFrameBounds frame in frames)
        {
            layer.Add(new XElement(
                svgNamespace + "g",
                    new XAttribute("class", $"{frame.Kind}-frame"),
                new XAttribute("data-frame-id", frame.FrameId),
                new XElement(svgNamespace + "title", SecurityElement.Escape(frame.Label) ?? string.Empty),
                new XElement(
                    svgNamespace + "rect",
                    new XAttribute("x", Format(frame.X)),
                    new XAttribute("y", Format(frame.Y)),
                    new XAttribute("width", Format(frame.Width)),
                    new XAttribute("height", Format(frame.Height)),
                    new XAttribute("fill", "none"),
                    new XAttribute("stroke", ResolveStroke(frame.Kind)),
                    new XAttribute("stroke-width", ResolveStrokeWidth(frame.Kind)),
                    new XAttribute("rx", frame.Kind == "subscription" ? "12" : frame.Kind == "vnet" ? "7" : "5"),
                    new XAttribute("pointer-events", "none")),
                new XElement(
                    svgNamespace + "text",
                    new XAttribute("x", Format(frame.X + 6.0d)),
                    new XAttribute("y", Format(frame.Y + 13.0d)),
                    new XAttribute("font-size", frame.Kind == "subscription" ? "13" : frame.Kind == "vnet" ? "11" : "10"),
                    new XAttribute("font-weight", "600"),
                    new XAttribute("fill", "#64748b"),
                    new XAttribute("pointer-events", "none"),
                    SecurityElement.Escape(frame.Label) ?? string.Empty)));
        }

        return layer;
    }

    private static string Format(double value)
    {
        return value.ToString("0.###", CultureInfo.InvariantCulture);
    }

    private static string ResolveStroke(string kind)
    {
        return kind switch
        {
            "subscription" => "#475569",
            "vnet" => "#94a3b8",
            _ => "#cbd5e1",
        };
    }

    private static string ResolveStrokeWidth(string kind)
    {
        return kind switch
        {
            "subscription" => "2.5",
            "vnet" => "1.5",
            _ => "1",
        };
    }
}
