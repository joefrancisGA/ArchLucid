using System.Globalization;
using System.Text;
using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

internal static class DiagramForestDataFlowStageSummarySvgEmitter
{
    private const string SummaryFill = "#374151";
    private const double SummaryFontSize = 12.0d;

    public static XElement? EmitLayer(
        XNamespace svgNamespace,
        IReadOnlyList<DiagramForestDataFlowColumnLayout.ColumnInfo> columns,
        IReadOnlyList<DiagramForestDataFlowColumnLayout.NodePlacement> placements,
        DiagramForestLayoutOptions options)
    {
        ArgumentNullException.ThrowIfNull(svgNamespace);
        ArgumentNullException.ThrowIfNull(columns);
        ArgumentNullException.ThrowIfNull(placements);
        ArgumentNullException.ThrowIfNull(options);

        if (columns.Count == 0 || placements.Count == 0)
        {
            return null;
        }

        Dictionary<int, int> columnIndexToStageIndex = columns
            .ToDictionary(column => column.ColumnIndex, column => column.StageIndex);
        Dictionary<int, string> stageLabelByIndex = columns
            .GroupBy(column => column.StageIndex)
            .ToDictionary(group => group.Key, group => group.First().Label);
        Dictionary<int, List<DiagramForestDataFlowColumnLayout.NodePlacement>> placementsByStage = [];

        foreach (DiagramForestDataFlowColumnLayout.NodePlacement placement in placements)
        {
            if (!columnIndexToStageIndex.TryGetValue(placement.ColumnIndex, out int stageIndex))
            {
                continue;
            }

            if (!placementsByStage.TryGetValue(stageIndex, out List<DiagramForestDataFlowColumnLayout.NodePlacement>? stagePlacements))
            {
                stagePlacements = [];
                placementsByStage[stageIndex] = stagePlacements;
            }

            stagePlacements.Add(placement);
        }

        int notStagedStageIndex = columns.Max(column => column.StageIndex);
        bool hasExplicitNotStagedLabel = stageLabelByIndex.TryGetValue(notStagedStageIndex, out string? notStagedLabel)
            && string.Equals(
                notStagedLabel,
                DiagramForestDataFlowColumnLayout.NotStagedColumnLabel,
                StringComparison.Ordinal);
        int notStagedCount = hasExplicitNotStagedLabel
            && placementsByStage.TryGetValue(notStagedStageIndex, out List<DiagramForestDataFlowColumnLayout.NodePlacement>? notStagedPlacements)
            ? notStagedPlacements.Count
            : 0;

        List<string> segments = [];

        foreach (KeyValuePair<int, List<DiagramForestDataFlowColumnLayout.NodePlacement>> entry in placementsByStage
                     .OrderBy(pair => pair.Key))
        {
            if (hasExplicitNotStagedLabel && entry.Key == notStagedStageIndex)
            {
                continue;
            }

            if (!stageLabelByIndex.TryGetValue(entry.Key, out string? stageLabel))
            {
                continue;
            }

            int count = entry.Value.Count;
            string segment = $"{count} {stageLabel}";

            if (string.Equals(stageLabel, "Storage", StringComparison.OrdinalIgnoreCase))
            {
                int used = 0;
                int none = 0;
                string? nonePhrase = null;

                foreach (DiagramForestDataFlowColumnLayout.NodePlacement placement in entry.Value)
                {
                    string? status = placement.Node.DataFlowRollupStatusLine
                        ?? placement.Metrics.ConsumerStatusLine;

                    if (status is null)
                    {
                        continue;
                    }

                    if (status.StartsWith("Used by", StringComparison.Ordinal))
                    {
                        used++;
                    }
                    else if (status.StartsWith("No consumer found", StringComparison.Ordinal))
                    {
                        none++;
                        nonePhrase = "no consumer found";
                    }
                    else if (status.Contains("no evidence checked", StringComparison.OrdinalIgnoreCase))
                    {
                        none++;
                        nonePhrase = "no evidence checked";
                    }
                }

                if (used + none > 0 && nonePhrase is not null)
                {
                    segment += $" ({used} used, {none} {nonePhrase})";
                }
            }

            segments.Add(segment);
        }

        if (segments.Count == 0)
        {
            return null;
        }

        StringBuilder summary = new();
        summary.AppendJoin(" → ", segments);

        if (notStagedCount > 0)
        {
            summary.Append(CultureInfo.InvariantCulture, $" · {notStagedCount} not staged");
        }

        double leftX = columns.Min(column => column.LeftX);
        double rightX = columns.Max(column => column.LeftX + column.Width);
        double centerX = (leftX + rightX) / 2.0d;
        double summaryY = options.Padding
            + options.DataFlowSkyLaneHeight
            + (options.DataFlowStageSummaryBand / 2.0d);

        return new XElement(
            svgNamespace + "g",
            new XAttribute("class", "data-flow-stage-summary"),
            new XElement(
                svgNamespace + "text",
                new XAttribute("class", "data-flow-stage-summary-text"),
                new XAttribute("x", FormatCoordinate(centerX)),
                new XAttribute("y", FormatCoordinate(summaryY)),
                new XAttribute("text-anchor", "middle"),
                new XAttribute("dominant-baseline", "middle"),
                new XAttribute("font-size", FormatCoordinate(SummaryFontSize)),
                new XAttribute("font-weight", "600"),
                new XAttribute("font-family", "system-ui, sans-serif"),
                new XAttribute("fill", SummaryFill),
                summary.ToString()));
    }

    private static string FormatCoordinate(double value)
    {
        return value.ToString("0.###", CultureInfo.InvariantCulture);
    }
}
