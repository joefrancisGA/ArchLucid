using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Left-to-right data-flow stage columns with reserved gutter and sky-lane bands.</summary>
internal static class DiagramForestDataFlowColumnLayout
{
    internal const int MaxCardsPerDataFlowSubcolumn = 12;

    internal sealed record ColumnInfo(
        int StageIndex,
        string Label,
        double LeftX,
        double Width,
        int ColumnIndex);

    internal sealed record NodePlacement(
        DiagramNode Node,
        double X,
        double Y,
        double Width,
        double Height,
        DiagramForestNodeMetrics Metrics,
        int ColumnIndex,
        bool IsHubSpokeHub = false);

    internal sealed record Result(
        IReadOnlyList<NodePlacement> Placements,
        IReadOnlyList<ColumnInfo> Columns);

    internal const string NotStagedColumnLabel = "Stage was not stored.";

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

        HashSet<string> connectedNodeIds = relevantEdges
            .SelectMany(edge => new[] { edge.FromNodeId, edge.ToNodeId })
            .ToHashSet(StringComparer.Ordinal);
        List<NodePlacement> placements = [];
        List<ColumnInfo> columns = [];
        double columnX = options.Padding;
        double nodeTop = options.Padding
            + options.DataFlowSkyLaneHeight
            + options.DataFlowStageSummaryBand
            + options.DataFlowStageLabelBand;

        foreach (List<DiagramNode> stage in orderedColumns)
        {
            List<DiagramNode> orderedStage = stage
                .OrderByDescending(node => connectedNodeIds.Contains(node.NodeId))
                .ToList();
            int stageIndex = orderedStage.First().SubgraphId is not null
                && stageOrder.TryGetValue(orderedStage.First().SubgraphId!, out int resolvedStageIndex)
                ? resolvedStageIndex
                : notStagedIndex;
            string label = ResolveColumnLabel(stageIndex, orderedSubgraphs, notStagedIndex);
            HashSet<string> stageNodeIds = orderedStage
                .Select(node => node.NodeId)
                .ToHashSet(StringComparer.Ordinal);
            List<DiagramEdge> stageEdges = relevantEdges
                .Where(edge => stageNodeIds.Contains(edge.FromNodeId) && stageNodeIds.Contains(edge.ToNodeId))
                .ToList();
            List<List<DiagramNode>> stageSubcolumnBatches = PackStageIntoSubcolumnBatches(
                orderedStage,
                stageEdges);

            foreach (List<DiagramNode> stageBatch in stageSubcolumnBatches)
            {
                HashSet<string> stageBatchIds = stageBatch
                    .Select(node => node.NodeId)
                    .ToHashSet(StringComparer.Ordinal);
                List<DiagramEdge> batchEdges = stageEdges
                    .Where(edge => stageBatchIds.Contains(edge.FromNodeId) && stageBatchIds.Contains(edge.ToNodeId))
                    .ToList();
                List<List<DiagramNode>> components = DiagramComponentBuilder.BuildConnectedComponents(
                    stageBatch,
                    batchEdges);
                int columnIndex = columns.Count;
                List<DiagramForestHubSpokeInteriorLayout.InteriorBounds> componentBounds = [];

                foreach (List<DiagramNode> component in components)
                {
                    componentBounds.Add(DiagramForestHubSpokeInteriorLayout.LayoutComponent(
                        component,
                        batchEdges,
                        options,
                        labelContext));
                }

                double columnWidth = componentBounds.Count == 0
                    ? options.UniformNodeWidth
                    : componentBounds.Max(bounds => bounds.Width);
                double nodeY = nodeTop;

                foreach (DiagramForestHubSpokeInteriorLayout.InteriorBounds bounds in componentBounds)
                {
                    double insetX = (columnWidth - bounds.Width) / 2.0d;

                    foreach (DiagramForestHubSpokeInteriorLayout.InteriorPlacement interior in bounds.Placements)
                    {
                        placements.Add(new NodePlacement(
                            interior.Node,
                            columnX + insetX + interior.LocalX,
                            nodeY + interior.LocalY,
                            interior.Width,
                            interior.Height,
                            interior.Metrics,
                            columnIndex,
                            interior.IsHubSpokeHub));
                    }

                    nodeY += bounds.Height + options.NodeVerticalGap;
                }

                columns.Add(new ColumnInfo(stageIndex, label, columnX, columnWidth, columnIndex));
                columnX += columnWidth + options.DataFlowColumnGutter;
            }
        }

        return new Result(placements, columns);
    }

    private static List<List<DiagramNode>> PackStageIntoSubcolumnBatches(
        IReadOnlyList<DiagramNode> orderedStage,
        IReadOnlyList<DiagramEdge> stageEdges)
    {
        if (orderedStage.Count == 0)
        {
            return [];
        }

        List<List<DiagramNode>> stageComponents = DiagramComponentBuilder.BuildConnectedComponents(
            orderedStage,
            stageEdges);
        Dictionary<string, int> stageOrderIndex = orderedStage
            .Select((node, index) => new { node.NodeId, Index = index })
            .ToDictionary(item => item.NodeId, item => item.Index, StringComparer.Ordinal);
        List<List<DiagramNode>> orderedComponents = stageComponents
            .OrderBy(component => component.Min(node => stageOrderIndex[node.NodeId]))
            .ThenBy(component => component[0].NodeId, StringComparer.Ordinal)
            .ToList();
        List<List<DiagramNode>> batches = [];
        List<DiagramNode> currentBatch = [];
        int currentBatchNodeCount = 0;

        foreach (List<DiagramNode> component in orderedComponents)
        {
            if (component.Count > MaxCardsPerDataFlowSubcolumn)
            {
                if (currentBatch.Count > 0)
                {
                    batches.Add(currentBatch);
                    currentBatch = [];
                    currentBatchNodeCount = 0;
                }

                batches.Add(component.ToList());
                continue;
            }

            if (currentBatchNodeCount > 0
                && currentBatchNodeCount + component.Count > MaxCardsPerDataFlowSubcolumn)
            {
                batches.Add(currentBatch);
                currentBatch = [];
                currentBatchNodeCount = 0;
            }

            currentBatch.AddRange(component);
            currentBatchNodeCount += component.Count;
        }

        if (currentBatch.Count > 0)
        {
            batches.Add(currentBatch);
        }

        return batches;
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

        return DiagramSubgraphLabelFormatter.FormatForDiagram(orderedSubgraphs[stageIndex].Label);
    }
}
