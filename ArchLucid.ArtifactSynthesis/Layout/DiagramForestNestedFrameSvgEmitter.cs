using System.Globalization;
using System.Security;
using System.Xml.Linq;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Paints VNet and subnet frames beneath resource-group frames.</summary>
public static class DiagramForestNestedFrameSvgEmitter
{
    public const double VnetCaptionFontSize = 11.0d;
    public const double CaptionIconGap = 4.0d;

    private static readonly AzureArchitectureIconCatalog IconCatalog = AzureArchitectureIconCatalog.Load();

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
                EmitCaption(svgNamespace, frame)));
        }

        return layer;
    }

    private static XElement EmitCaption(XNamespace svgNamespace, DiagramForestNestedFrameBounds frame)
    {
        bool isVnet = frame.Kind == "vnet";
        double fontSize = frame.Kind == "subscription" ? 13.0d : isVnet ? VnetCaptionFontSize : 10.0d;
        double textX = frame.X + 6.0d;
        AzureArchitectureIconCatalogEntry? icon = isVnet
            ? IconCatalog.Resolve("Microsoft.Network/virtualNetworks")
            : null;
        if (icon is not null)
        {
            textX += fontSize + CaptionIconGap;
        }

        XElement group = new(svgNamespace + "g", new XAttribute("class", $"{frame.Kind}-frame-caption"));
        if (icon is not null)
        {
            double labelWidth = Math.Max(24.0d, frame.Label.Length * 6.6d);
            double haloWidth = fontSize + CaptionIconGap + labelWidth + 8.0d;
            group.Add(new XElement(
                svgNamespace + "rect",
                new XAttribute("class", "vnet-frame-label-halo"),
                new XAttribute("x", Format(frame.X + 2.0d)),
                new XAttribute("y", Format(frame.Y + 1.0d)),
                new XAttribute("width", Format(haloWidth)),
                new XAttribute("height", Format(fontSize + 4.0d)),
                new XAttribute("fill", "#ffffff"),
                new XAttribute("stroke", "none"),
                new XAttribute("pointer-events", "none")));
            group.Add(DiagramForestNodeSvgEmitter.EmitAzureIcon(
                svgNamespace,
                icon,
                fontSize,
                frame.X + 4.0d,
                frame.Y + 2.0d));
        }

        group.Add(new XElement(
            svgNamespace + "text",
            new XAttribute("x", Format(textX)),
            new XAttribute("y", Format(frame.Y + 13.0d)),
            new XAttribute("font-size", Format(fontSize)),
            new XAttribute("font-weight", isVnet ? "700" : "600"),
            new XAttribute("fill", "#64748b"),
            new XAttribute("pointer-events", "none"),
            SecurityElement.Escape(frame.Label) ?? string.Empty));
        return group;
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
