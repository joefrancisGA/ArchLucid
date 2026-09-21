using System.Globalization;
using System.Xml.Linq;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Lock-and-arrow badge for inventory nodes reached through a private endpoint.</summary>
public static class DiagramForestPrivateEndpointAccessSvgEmitter
{
    private const double LockDesignSize = 12.0d;
    private const double ArrowHeight = 6.0d;

    public const double LockSize = 8.0d;

    public const double ArrowWidth = 6.0d;

    public const double LockArrowGap = 2.0d;

    public const double IndicatorGapBeforePictogram = 4.0d;

    public static double ReservedWidth =>
        LockSize + LockArrowGap + ArrowWidth + IndicatorGapBeforePictogram;

    public static XElement Emit(
        XNamespace svgNamespace,
        double x,
        double contentTop,
        double contentHeight)
    {
        ArgumentNullException.ThrowIfNull(svgNamespace);

        double centerY = contentTop + (contentHeight / 2.0);
        double lockY = centerY - (LockSize / 2.0);
        double arrowX = x + LockSize + LockArrowGap;
        double arrowY = centerY - (ArrowHeight / 2.0);

        XElement group = new(
            svgNamespace + "g",
            new XAttribute("class", "private-endpoint-access"),
            new XAttribute("aria-hidden", "true"));
        group.Add(new XElement(svgNamespace + "title", "Private endpoint access"));
        group.Add(EmitLock(svgNamespace, x, lockY));
        group.Add(EmitArrow(svgNamespace, arrowX, arrowY));

        return group;
    }

    private static XElement EmitLock(XNamespace svgNamespace, double x, double y)
    {
        double scale = LockSize / LockDesignSize;

        XElement group = new(
            svgNamespace + "g",
            new XAttribute("class", "private-endpoint-lock"),
            new XAttribute(
                "transform",
                string.Create(CultureInfo.InvariantCulture, $"translate({x:0.###},{y:0.###}) scale({scale:0.###})")));

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

    private static XElement EmitArrow(XNamespace svgNamespace, double x, double y)
    {
        return new XElement(
            svgNamespace + "g",
            new XAttribute("class", "private-endpoint-arrow"),
            new XElement(
                svgNamespace + "path",
                new XAttribute("d", $"M {Format(x)} {Format(y)} L {Format(x + ArrowWidth)} {Format(y + (ArrowHeight / 2.0))} L {Format(x)} {Format(y + ArrowHeight)} z"),
                new XAttribute("fill", "#0f766e")));
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
