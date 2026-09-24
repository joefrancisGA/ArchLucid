using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Left-to-right data-flow stage columns with reserved gutter and sky-lane bands.</summary>
internal static class DiagramForestDataFlowColumnLayout
{
    internal sealed record ColumnInfo(
        int StageIndex,
        string Label,
        double LeftX,
        double Width);

    internal sealed record NodePlacement(
        DiagramNode Node,
        double X,
        double Y,
        double Width,
        double Height,
        DiagramForestNodeMetrics Metrics,
        int ColumnIndex);

    internal sealed record Result(
        IReadOnlyList<NodePlacement> Placements,
        IReadOnlyList<ColumnInfo> Columns);

    internal const string NotStagedColumnLabel = "Not staged";

    public static Result Plan(
        IReadOnlyList<DiagramNode> nodes,
        IReadOnlyList<DiagramSubgraph> subgraphs,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext,
        IReadOnlyList<DiagramEdge>? edges = null)
    {
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(subgraphs);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(labelContext);

        List<DiagramSubgraph> orderedSubgraphs = subgraphs
            .OrderBy(subgraph => subgraph.OrderKey)
            .ToList();
        Dictionary<string, int> stageOrder = orderedSubgraphs
            .Select((subgraph, index) => new { subgraph.SubgraphId, Index = index })
            .ToDictionary(item => item.SubgraphId, item => item.Index, StringComparer.Ordinal);
        int notStagedIndex = orderedSubgraphs.Count;
        List<IGrouping<int, DiagramNode>> columnGroups = nodes
            .GroupBy(node =>
                node.SubgraphId is not null && stageOrder.TryGetValue(node.SubgraphId, out int index)
                    ? index
                    : notStagedIndex)
            .OrderBy(group => group.Key)
            .ToList();
        List<List<DiagramNode>> orderedColumns = columnGroups
            .Select(column => column
                .OrderBy(node => node.OrderKey)
                .ThenBy(node => node.NodeId, StringComparer.Ordinal)
                .ToList())
            .ToList();
        IReadOnlyList<DiagramEdge> relevantEdges = edges ?? [];

        if (relevantEdges.Count > 0 && orderedColumns.Count > 1)
        {
            orderedColumns = ApplyColumnCrossingOrder(orderedColumns, relevantEdges);
        }

        List<NodePlacement> placements = [];
        List<ColumnInfo> columns = [];
        double columnX = options.Padding;
        double nodeTop = options.Padding + options.DataFlowSkyLaneHeight + options.DataFlowStageLabelBand;

        foreach (List<DiagramNode> column in orderedColumns)
        {
            List<(DiagramNode Node, DiagramForestNodeMetrics Metrics)> sized = column
                .Select(node => (
                    Node: node,
                    Metrics: DiagramForestNodeMetricsCalculator.Measure(node, options, labelContext)))
                .ToList();
            double columnWidth = sized.Count == 0
                ? options.UniformNodeWidth
                : sized.Max(item => item.Metrics.Width);
            int stageIndex = column.First().SubgraphId is not null
                && stageOrder.TryGetValue(column.First().SubgraphId!, out int resolvedStageIndex)
                ? resolvedStageIndex
                : notStagedIndex;
            string label = ResolveColumnLabel(stageIndex, orderedSubgraphs, notStagedIndex);
            columns.Add(new ColumnInfo(stageIndex, label, columnX, columnWidth));
            double nodeY = nodeTop;

            foreach ((DiagramNode node, DiagramForestNodeMetrics metrics) in sized)
            {
                placements.Add(new NodePlacement(
                    node,
                    columnX + ((columnWidth - metrics.Width) / 2.0d),
                    nodeY,
                    metrics.Width,
                    metrics.Height,
                    metrics,
                    stageIndex));
                nodeY += metrics.Height + options.NodeVerticalGap;
            }

            columnX += columnWidth + options.DataFlowColumnGutter;
        }

        return new Result(placements, columns);
    }

    private static List<List<DiagramNode>> ApplyColumnCrossingOrder(
        List<List<DiagramNode>> orderedColumns,
        IReadOnlyList<DiagramEdge> relevantEdges)
    {
        List<List<DiagramNode>> result = orderedColumns
            .Select(column => column.ToList())
            .ToList();

        for (int columnIndex = 0; columnIndex < result.Count; columnIndex++)
        {
            IReadOnlyList<DiagramNode>? previousColumn = columnIndex > 0 ? result[columnIndex - 1] : null;
            IReadOnlyList<DiagramNode>? nextColumn = columnIndex < result.Count - 1 ? result[columnIndex + 1] : null;

            if (previousColumn is null)
            {
                continue;
            }

            result[columnIndex] = DiagramLayerCrossingOrder.OrderByAdjacentLayer(
                result[columnIndex],
                previousColumn,
                adjacentIsPrevious: true,
                nextColumn,
                relevantEdges);
        }

        for (int columnIndex = result.Count - 1; columnIndex >= 0; columnIndex--)
        {
            IReadOnlyList<DiagramNode>? previousColumn = columnIndex > 0 ? result[columnIndex - 1] : null;
            IReadOnlyList<DiagramNode>? nextColumn = columnIndex < result.Count - 1 ? result[columnIndex + 1] : null;

            if (nextColumn is null)
            {
                continue;
            }

            result[columnIndex] = DiagramLayerCrossingOrder.OrderByAdjacentLayer(
                result[columnIndex],
                nextColumn,
                adjacentIsPrevious: false,
                previousColumn,
                relevantEdges);
        }

        return result;
    }

    private static string ResolveColumnLabel(
        int stageIndex,
        IReadOnlyList<DiagramSubgraph> orderedSubgraphs,
        int notStagedIndex)
    {
        if (stageIndex >= notStagedIndex)
        {
            return NotStagedColumnLabel;
        }

        return orderedSubgraphs[stageIndex].Label;
    }
}
