using System.Globalization;
using System.Xml.Linq;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>
/// Emits original category pictograms. These are not Microsoft Azure product icons.
/// </summary>
public static class DiagramInventoryPictogramSvgEmitter
{
    private const double DesignSize = 24.0;

    public static XElement Emit(XNamespace svgNamespace, DiagramInventoryPictogramKind kind, double size, double x, double y)
    {
        ArgumentNullException.ThrowIfNull(svgNamespace);

        double scale = size / DesignSize;
        XElement group = new(
            svgNamespace + "g",
            new XAttribute("class", "pictogram"),
            new XAttribute("data-kind", kind.ToString()),
            new XAttribute(
                "transform",
                string.Create(CultureInfo.InvariantCulture, $"translate({x:0.###},{y:0.###}) scale({scale:0.###})")));

        switch (kind)
        {
            case DiagramInventoryPictogramKind.Compute:
                group.Add(Rect(svgNamespace, 3, 4, 18, 12, DiagramInventoryPictogramKindColors.FillFor(kind)));
                group.Add(Rect(svgNamespace, 10, 16, 4, 3, "#1d4ed8"));
                group.Add(Rect(svgNamespace, 7, 19, 10, 2, "#1e40af"));
                break;
            case DiagramInventoryPictogramKind.Network:
                group.Add(Circle(svgNamespace, 6, 7, 3, DiagramInventoryPictogramKindColors.FillFor(kind)));
                group.Add(Circle(svgNamespace, 18, 7, 3, DiagramInventoryPictogramKindColors.FillFor(kind)));
                group.Add(Circle(svgNamespace, 12, 17, 3, DiagramInventoryPictogramKindColors.FillFor(kind)));
                group.Add(Line(svgNamespace, 8.5, 9, 10.5, 15, "#0d9488"));
                group.Add(Line(svgNamespace, 15.5, 9, 13.5, 15, "#0d9488"));
                group.Add(Line(svgNamespace, 9, 7, 15, 7, "#0d9488"));
                break;
            case DiagramInventoryPictogramKind.Data:
                group.Add(Ellipse(svgNamespace, 12, 6, 8, 3, DiagramInventoryPictogramKindColors.FillFor(kind)));
                group.Add(Rect(svgNamespace, 4, 6, 16, 10, DiagramInventoryPictogramKindColors.FillFor(kind)));
                group.Add(Ellipse(svgNamespace, 12, 16, 8, 3, "#6d28d9"));
                break;
            case DiagramInventoryPictogramKind.Storage:
                group.Add(Rect(svgNamespace, 4, 4, 16, 4, DiagramInventoryPictogramKindColors.FillFor(kind)));
                group.Add(Rect(svgNamespace, 4, 10, 16, 4, "#ea580c"));
                group.Add(Rect(svgNamespace, 4, 16, 16, 4, "#c2410c"));
                break;
            case DiagramInventoryPictogramKind.Identity:
                group.Add(Circle(svgNamespace, 12, 8, 4, DiagramInventoryPictogramKindColors.FillFor(kind)));
                group.Add(new XElement(
                    svgNamespace + "path",
                    new XAttribute("d", "M5 20c0-4 3-6 7-6s7 2 7 6"),
                    new XAttribute("fill", "none"),
                    new XAttribute("stroke", DiagramInventoryPictogramKindColors.FillFor(kind)),
                    new XAttribute("stroke-width", "2"),
                    new XAttribute("stroke-linecap", "round")));
                break;
            default:
                group.Add(Rect(svgNamespace, 4, 4, 16, 16, DiagramInventoryPictogramKindColors.FillFor(kind)));
                break;
        }

        return group;
    }

    private static XElement Rect(XNamespace svgNamespace, double x, double y, double width, double height, string fill)
    {
        return new XElement(
            svgNamespace + "rect",
            new XAttribute("x", Format(x)),
            new XAttribute("y", Format(y)),
            new XAttribute("width", Format(width)),
            new XAttribute("height", Format(height)),
            new XAttribute("rx", "2"),
            new XAttribute("fill", fill));
    }

    private static XElement Circle(XNamespace svgNamespace, double cx, double cy, double radius, string fill)
    {
        return new XElement(
            svgNamespace + "circle",
            new XAttribute("cx", Format(cx)),
            new XAttribute("cy", Format(cy)),
            new XAttribute("r", Format(radius)),
            new XAttribute("fill", fill));
    }

    private static XElement Ellipse(XNamespace svgNamespace, double cx, double cy, double rx, double ry, string fill)
    {
        return new XElement(
            svgNamespace + "ellipse",
            new XAttribute("cx", Format(cx)),
            new XAttribute("cy", Format(cy)),
            new XAttribute("rx", Format(rx)),
            new XAttribute("ry", Format(ry)),
            new XAttribute("fill", fill));
    }

    private static XElement Line(XNamespace svgNamespace, double x1, double y1, double x2, double y2, string stroke)
    {
        return new XElement(
            svgNamespace + "line",
            new XAttribute("x1", Format(x1)),
            new XAttribute("y1", Format(y1)),
            new XAttribute("x2", Format(x2)),
            new XAttribute("y2", Format(y2)),
            new XAttribute("stroke", stroke),
            new XAttribute("stroke-width", "1.5"));
    }

    private static string Format(double value)
    {
        return value.ToString("0.###", CultureInfo.InvariantCulture);
    }
}
