using System.Globalization;
using System.Xml.Linq;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Small padlock badge for inventory nodes reached through a private endpoint.</summary>
public static class DiagramForestPrivateEndpointLockSvgEmitter
{
    private const double DesignSize = 12.0d;

    public static XElement Emit(
        XNamespace svgNamespace,
        double nodeWidth,
        int nodePaddingX,
        int nodePaddingY,
        double size = DesignSize)
    {
        ArgumentNullException.ThrowIfNull(svgNamespace);

        double scale = size / DesignSize;
        double x = nodeWidth - nodePaddingX - size;
        double y = nodePaddingY;

        XElement group = new(
            svgNamespace + "g",
            new XAttribute("class", "private-endpoint-lock"),
            new XAttribute("aria-hidden", "true"),
            new XAttribute(
                "transform",
                string.Create(CultureInfo.InvariantCulture, $"translate({x:0.###},{y:0.###}) scale({scale:0.###})")));

        group.Add(new XElement(svgNamespace + "title", "Private endpoint access"));
        group.Add(Rect(svgNamespace, 3.5, 6.5, 5, 4.5, "#0f766e"));
        group.Add(new XElement(
            svgNamespace + "path",
            new XAttribute("d", "M4 6.5V4.8C4 3.25 5.2 2 6.75 2S9.5 3.25 9.5 4.8V6.5"),
            new XAttribute("fill", "none"),
            new XAttribute("stroke", "#0f766e"),
            new XAttribute("stroke-width", "1.4"),
            new XAttribute("stroke-linecap", "round")));

        return group;
    }

    private static XElement Rect(
        XNamespace svgNamespace,
        double x,
        double y,
        double width,
        double height,
        string fill)
    {
        return new XElement(
            svgNamespace + "rect",
            new XAttribute("x", Format(x)),
            new XAttribute("y", Format(y)),
            new XAttribute("width", Format(width)),
            new XAttribute("height", Format(height)),
            new XAttribute("rx", "0.8"),
            new XAttribute("fill", fill));
    }

    private static string Format(double value)
    {
        return value.ToString("0.###", CultureInfo.InvariantCulture);
    }
}
