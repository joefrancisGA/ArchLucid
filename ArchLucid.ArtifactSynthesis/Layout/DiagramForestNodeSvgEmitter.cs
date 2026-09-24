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

        string accessibilityTitle = metrics.HasPrivateEndpointAccess
            ? $"{metrics.Caption.AccessibilityTitle} — Private endpoint access"
            : metrics.Caption.AccessibilityTitle;

        XElement group = new(
            svgNamespace + "g",
            new XAttribute("class", "node"),
            new XAttribute("id", $"node-{nodeId}"));
        group.Add(new XElement(svgNamespace + "title", Escape(accessibilityTitle)));
        group.Add(new XElement(
            svgNamespace + "rect",
            new XAttribute("class", "node-card"),
            new XAttribute("width", Format(width)),
            new XAttribute("height", Format(height)),
            new XAttribute("fill", ArchitectureDiagramMermaidPalette.LightNodeFill),
            new XAttribute("stroke", ArchitectureDiagramMermaidPalette.LightNodeBorder),
            new XAttribute("stroke-width", "1.5"),
            new XAttribute("rx", "6"),
            new XAttribute("pointer-events", "all")));
        group.Add(new XElement(
            svgNamespace + "rect",
            new XAttribute("class", "node-accent"),
            new XAttribute("x", "0"),
            new XAttribute("y", "0"),
            new XAttribute("width", "4"),
            new XAttribute("height", Format(height)),
            new XAttribute("fill", DiagramInventoryPictogramKindColors.FillFor(metrics.PictogramKind)),
            new XAttribute("stroke", "none"),
            new XAttribute("pointer-events", "none")));

        double textBlockHeight = (metrics.NameLines.Count * options.LineHeight)
            + (metrics.ResourceGroupLines.Count * options.LineHeight);
        double contentHeight = Math.Max(options.PictogramSize, textBlockHeight);
        double contentTop = (height - contentHeight) / 2.0;
        double pictogramY = contentTop + ((contentHeight - options.PictogramSize) / 2.0);
        double privateEndpointIndicatorWidth = metrics.HasPrivateEndpointAccess
            ? DiagramForestPrivateEndpointAccessSvgEmitter.ReservedWidth
            : 0.0d;
        double pictogramX = options.NodePaddingX + privateEndpointIndicatorWidth;
        double textX = pictogramX + options.PictogramSize + options.IconToLabelGap;
        double firstLineBaseline = contentTop + (options.LineHeight * 0.75);

        if (metrics.HasPrivateEndpointAccess)
        {
            group.Add(
                DiagramForestPrivateEndpointAccessSvgEmitter.Emit(
                    svgNamespace,
                    options.NodePaddingX,
                    contentTop,
                    contentHeight));
        }

        if (metrics.AzureIcon is not null)
        {
            group.Add(EmitAzureIcon(
                svgNamespace,
                metrics.AzureIcon,
                options.PictogramSize,
                pictogramX,
                pictogramY));
        }
        else
        {
            group.Add(
                DiagramInventoryPictogramSvgEmitter.Emit(
                    svgNamespace,
                    metrics.PictogramKind,
                    options.PictogramSize,
                    pictogramX,
                    pictogramY));
        }

        XElement text = new(
            svgNamespace + "text",
            new XAttribute("x", Format(textX)),
            new XAttribute("y", Format(firstLineBaseline)),
            new XAttribute("text-anchor", "start"),
            new XAttribute("font-size", "12"),
            new XAttribute("font-weight", "700"),
            new XAttribute("font-family", "system-ui,sans-serif"),
            new XAttribute("fill", ArchitectureDiagramMermaidPalette.LightNodeText));

        for (int index = 0; index < metrics.NameLines.Count; index++)
        {
            string line = metrics.NameLines[index];
            XElement tspan = new(
                svgNamespace + "tspan",
                new XAttribute("x", Format(textX)),
                Escape(line));

            if (index > 0)
            {
                tspan.Add(new XAttribute("dy", Format(options.LineHeight)));
            }

            text.Add(tspan);
        }

        group.Add(text);

        if (metrics.ResourceGroupLines.Count > 0)
        {
            double resourceGroupTextY = firstLineBaseline + (metrics.NameLines.Count * options.LineHeight);
            XElement resourceGroupText = new(
                svgNamespace + "text",
                new XAttribute("x", Format(textX)),
                new XAttribute("y", Format(resourceGroupTextY)),
                new XAttribute("text-anchor", "start"),
                new XAttribute("font-size", "11"),
                new XAttribute("font-weight", "400"),
                new XAttribute("font-family", "system-ui,sans-serif"),
                new XAttribute("fill", ArchitectureDiagramMermaidPalette.LightNodeCaption));

            for (int index = 0; index < metrics.ResourceGroupLines.Count; index++)
            {
                string line = metrics.ResourceGroupLines[index];
                XElement tspan = new(
                    svgNamespace + "tspan",
                    new XAttribute("x", Format(textX)),
                    Escape(line));

                if (index > 0)
                {
                    tspan.Add(new XAttribute("dy", Format(options.LineHeight)));
                }

                resourceGroupText.Add(tspan);
            }

            group.Add(resourceGroupText);
        }

        return group;
    }

    private static string Escape(string value)
    {
        return SecurityElement.Escape(value) ?? string.Empty;
    }

    public static XElement EmitAzureIcon(
        XNamespace svgNamespace,
        AzureArchitectureIconCatalogEntry icon,
        double size,
        double x,
        double y)
    {
        XElement sourceSvg = XElement.Parse(icon.SvgMarkup, LoadOptions.PreserveWhitespace);
        double sourceWidth = ParseCoordinate(sourceSvg.Attribute("width")?.Value, 18.0d);
        double sourceHeight = ParseCoordinate(sourceSvg.Attribute("height")?.Value, 18.0d);
        XElement group = new(
            svgNamespace + "g",
            new XAttribute("class", "azure-icon"),
            new XAttribute("data-file", icon.File),
            new XAttribute(
                "transform",
                string.Create(
                    CultureInfo.InvariantCulture,
                    $"translate({x:0.###},{y:0.###}) scale({size / sourceWidth:0.######},{size / sourceHeight:0.######})")));

        foreach (XElement child in sourceSvg.Elements())
        {
            group.Add(new XElement(child));
        }

        return group;
    }

    private static double ParseCoordinate(string? value, double fallback)
    {
        return double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out double parsed)
            && parsed > 0
            ? parsed
            : fallback;
    }

    private static string Format(double value)
    {
        return value.ToString("0.###", CultureInfo.InvariantCulture);
    }
}
