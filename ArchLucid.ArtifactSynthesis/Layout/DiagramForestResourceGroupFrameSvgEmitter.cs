using System.Globalization;
using System.Security;
using System.Xml.Linq;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Solid resource-group frames around packed forest node groups.</summary>
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
            layer.Add(EmitFrame(svgNamespace, frame));
        }

        return layer;
    }

    private static XElement EmitFrame(
        XNamespace svgNamespace,
        DiagramResourceGroupPacker.ResourceGroupFrameBounds frame)
    {
        string escapedName = Escape(frame.GroupName);
        double labelX = frame.X + DiagramForestResourceGroupFrameStyle.LabelInsetX;
        double labelBaselineY = frame.Y + DiagramForestResourceGroupFrameStyle.LabelBaselineY;
        double labelWidth = EstimateLabelWidth(frame.GroupName);
        double haloWidth = labelWidth + (DiagramForestResourceGroupFrameStyle.HaloPaddingX * 2.0d);
        double haloHeight = DiagramForestResourceGroupFrameStyle.LabelFontSize
            + (DiagramForestResourceGroupFrameStyle.HaloPaddingY * 2.0d);
        double haloX = labelX - DiagramForestResourceGroupFrameStyle.HaloPaddingX;
        double haloY = labelBaselineY - DiagramForestResourceGroupFrameStyle.LabelFontSize
            - DiagramForestResourceGroupFrameStyle.HaloPaddingY;

        return new XElement(
            svgNamespace + "g",
            new XAttribute("class", "rg-frame"),
            new XAttribute("data-frame-cell-id", frame.FrameCellId),
            new XElement(svgNamespace + "title", escapedName),
            new XElement(
                svgNamespace + "rect",
                new XAttribute("class", "rg-frame-plate"),
                new XAttribute("x", Format(frame.X)),
                new XAttribute("y", Format(frame.Y)),
                new XAttribute("width", Format(frame.Width)),
                new XAttribute("height", Format(frame.Height)),
                new XAttribute("fill", DiagramForestResourceGroupFrameStyle.Fill),
                new XAttribute("stroke", DiagramForestResourceGroupFrameStyle.Stroke),
                new XAttribute("stroke-width", Format(DiagramForestResourceGroupFrameStyle.StrokeWidth)),
                new XAttribute("rx", Format(DiagramForestResourceGroupFrameStyle.CornerRadius)),
                new XAttribute("pointer-events", "none")),
            new XElement(
                svgNamespace + "rect",
                new XAttribute("class", "rg-frame-label-halo"),
                new XAttribute("x", Format(haloX)),
                new XAttribute("y", Format(haloY)),
                new XAttribute("width", Format(haloWidth)),
                new XAttribute("height", Format(haloHeight)),
                new XAttribute("fill", DiagramForestResourceGroupFrameStyle.HaloFill),
                new XAttribute("stroke", DiagramForestResourceGroupFrameStyle.HaloStroke),
                new XAttribute("stroke-width", Format(DiagramForestResourceGroupFrameStyle.HaloStrokeWidth)),
                new XAttribute("rx", Format(DiagramForestResourceGroupFrameStyle.HaloRadius)),
                new XAttribute("pointer-events", "none")),
            new XElement(
                svgNamespace + "text",
                new XAttribute("class", "rg-frame-label"),
                new XAttribute("x", Format(labelX)),
                new XAttribute("y", Format(labelBaselineY)),
                new XAttribute("text-anchor", "start"),
                new XAttribute("font-size", Format(DiagramForestResourceGroupFrameStyle.LabelFontSize)),
                new XAttribute("font-weight", "700"),
                new XAttribute("font-family", "system-ui,sans-serif"),
                new XAttribute("fill", DiagramForestResourceGroupFrameStyle.LabelFill),
                escapedName));
    }

    private static double EstimateLabelWidth(string label)
    {
        return Math.Max(24.0d, label.Length * 7.2d);
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
