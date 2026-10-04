using System.Globalization;
using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

internal static class DiagramForestDataFlowStageLabelSvgEmitter
{
    private const string LabelFill = "#111827";
    private const double LabelFontSize = 13.0d;

    public static XElement EmitLayer(
        XNamespace svgNamespace,
        IReadOnlyList<DiagramForestDataFlowColumnLayout.ColumnInfo> columns,
        IReadOnlyList<DiagramForestDataFlowColumnLayout.NodePlacement> placements,
        IReadOnlyList<DiagramEdge> edges,
        DiagramForestLayoutOptions options)
    {
        ArgumentNullException.ThrowIfNull(svgNamespace);
        ArgumentNullException.ThrowIfNull(columns);
        ArgumentNullException.ThrowIfNull(placements);
        ArgumentNullException.ThrowIfNull(edges);
        ArgumentNullException.ThrowIfNull(options);
        HashSet<string> connectedNodeIds = edges
            .SelectMany(edge => new[] { edge.FromNodeId, edge.ToNodeId })
            .ToHashSet(StringComparer.Ordinal);

        XElement layer = new(svgNamespace + "g", new XAttribute("class", "data-flow-stage-labels"));
        double labelY = options.Padding
            + options.DataFlowSkyLaneHeight
            + options.DataFlowStageSummaryBand
            + (options.DataFlowStageLabelBand / 2.0d);

        foreach (IGrouping<int, DiagramForestDataFlowColumnLayout.ColumnInfo> stageColumns in columns
                     .GroupBy(column => column.StageIndex)
                     .OrderBy(group => group.Key))
        {
            double leftX = stageColumns.Min(column => column.LeftX);
            double rightX = stageColumns.Max(column => column.LeftX + column.Width);
            double centerX = (leftX + rightX) / 2.0d;
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
                stageColumns.First().Label));

            DiagramForestDataFlowColumnLayout.NodePlacement? firstUnconnected = placements
                .Where(placement =>
                    placement.ColumnIndex >= stageColumns.Min(column => column.ColumnIndex)
                    && placement.ColumnIndex <= stageColumns.Max(column => column.ColumnIndex)
                    && !connectedNodeIds.Contains(placement.Node.NodeId))
                .OrderBy(placement => placement.ColumnIndex)
                .ThenBy(placement => placement.Y)
                .FirstOrDefault();

            if (firstUnconnected is not null)
            {
                layer.Add(new XElement(
                    svgNamespace + "text",
                    new XAttribute("class", "data-flow-not-connected-label"),
                    new XAttribute("x", FormatCoordinate(firstUnconnected.X + (firstUnconnected.Width / 2.0d))),
                    new XAttribute("y", FormatCoordinate(firstUnconnected.Y - 5.0d)),
                    new XAttribute("text-anchor", "middle"),
                    new XAttribute("font-size", "10"),
                    new XAttribute("font-weight", "600"),
                    new XAttribute("font-family", "system-ui, sans-serif"),
                    new XAttribute("fill", "#6b7280"),
                    "Not connected"));
            }
        }

        return layer;
    }

    private static string FormatCoordinate(double value)
    {
        return value.ToString("0.###", CultureInfo.InvariantCulture);
    }
}
