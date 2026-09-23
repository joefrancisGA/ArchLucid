using System.Globalization;
using System.Xml.Linq;

namespace ArchLucid.ArtifactSynthesis.Layout;

internal static class DiagramForestDataFlowStageLabelSvgEmitter
{
    private const string LabelFill = "#111827";
    private const double LabelFontSize = 13.0d;

    public static XElement EmitLayer(
        XNamespace svgNamespace,
        IReadOnlyList<DiagramForestDataFlowColumnLayout.ColumnInfo> columns,
        DiagramForestLayoutOptions options)
    {
        ArgumentNullException.ThrowIfNull(svgNamespace);
        ArgumentNullException.ThrowIfNull(columns);
        ArgumentNullException.ThrowIfNull(options);

        XElement layer = new(svgNamespace + "g", new XAttribute("class", "data-flow-stage-labels"));
        double labelY = options.Padding + options.DataFlowSkyLaneHeight + (options.DataFlowStageLabelBand / 2.0d);

        foreach (DiagramForestDataFlowColumnLayout.ColumnInfo column in columns)
        {
            double centerX = column.LeftX + (column.Width / 2.0d);
            layer.Add(new XElement(
                svgNamespace + "text",
                new XAttribute("class", "data-flow-stage-label"),
                new XAttribute("x", FormatCoordinate(centerX)),
                new XAttribute("y", FormatCoordinate(labelY)),
                new XAttribute("text-anchor", "middle"),
                new XAttribute("dominant-baseline", "middle"),
                new XAttribute("font-size", FormatCoordinate(LabelFontSize)),
                new XAttribute("font-weight", "700"),
                new XAttribute("font-family", "system-ui, sans-serif"),
                new XAttribute("fill", LabelFill),
                column.Label));
        }

        return layer;
    }

    private static string FormatCoordinate(double value)
    {
        return value.ToString("0.###", CultureInfo.InvariantCulture);
    }
}
