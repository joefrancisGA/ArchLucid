using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>
/// Orders resource-group layout cells left-to-right along visible
/// <c>From → To</c> edges so forest packing paints dependencies LTR.
/// </summary>
public static class DiagramResourceGroupCellFlowPlanner
{
    public static IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> OrderCells(
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> cells,
        IReadOnlyList<DiagramEdge> visibleEdges)
    {
        ArgumentNullException.ThrowIfNull(cells);
        ArgumentNullException.ThrowIfNull(visibleEdges);

        if (cells.Count <= 1)
        {
            return cells;
        }

        return GroupByLayers(cells, visibleEdges)
            .SelectMany(layer => layer)
            .ToList();
    }

    /// <summary>
    /// Each inner list is one left-to-right rank. Inter-group edges hop from
    /// layer n to layer n+1 so Visio-style frames stack in columns.
    /// </summary>
    public static IReadOnlyList<IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell>> GroupByLayers(
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> cells,
        IReadOnlyList<DiagramEdge> visibleEdges)
    {
        ArgumentNullException.ThrowIfNull(cells);
        ArgumentNullException.ThrowIfNull(visibleEdges);

        if (cells.Count == 0)
        {
            return [];
        }

        if (cells.Count == 1)
        {
            return [[cells[0]]];
        }

        CellRank rank = RankCells(cells, visibleEdges);
        List<List<DiagramResourceGroupPacker.ResourceGroupCell>> layers = [];

        for (int layer = 0; layer <= rank.MaxLayer; layer++)
        {
            List<DiagramResourceGroupPacker.ResourceGroupCell> members = [];

            for (int cellIndex = 0; cellIndex < cells.Count; cellIndex++)
            {
                if (rank.Visited[cellIndex] && rank.LayerByCell[cellIndex] == layer)
                {
                    members.Add(cells[cellIndex]);
                }
            }

            if (members.Count > 0)
            {
                layers.Add(members);
            }
        }

        List<DiagramResourceGroupPacker.ResourceGroupCell> unranked = [];

        for (int cellIndex = 0; cellIndex < cells.Count; cellIndex++)
        {
            if (!rank.Visited[cellIndex])
            {
                unranked.Add(cells[cellIndex]);
            }
        }

        if (unranked.Count > 0)
        {
            layers.Add(unranked);
        }

        return layers;
    }

    private static CellRank RankCells(
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> cells,
        IReadOnlyList<DiagramEdge> visibleEdges)
    {
        Dictionary<string, int> cellIndexByNodeId = BuildNodeCellIndex(cells);
        int[] inDegree = new int[cells.Count];
        List<int>[] outgoing = Enumerable.Range(0, cells.Count)
            .Select(_ => new List<int>())
            .ToArray();
        HashSet<(int FromCell, int ToCell)> seenCellEdges = [];

        foreach (DiagramEdge edge in visibleEdges)
        {
            if (edge is null || edge.IsLayoutOnly)
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(edge.FromNodeId) || string.IsNullOrWhiteSpace(edge.ToNodeId))
            {
                continue;
            }

            if (!cellIndexByNodeId.TryGetValue(edge.FromNodeId, out int fromCell)
                || !cellIndexByNodeId.TryGetValue(edge.ToNodeId, out int toCell))
            {
                continue;
            }

            // Intra-cell edges do not change how sibling cells pack horizontally.
            if (fromCell == toCell)
            {
                continue;
            }

            if (!seenCellEdges.Add((fromCell, toCell)))
            {
                continue;
            }

            inDegree[toCell]++;
            outgoing[fromCell].Add(toCell);
        }

        int[] layerByCell = new int[cells.Count];
        bool[] visited = new bool[cells.Count];
        Queue<int> queue = new();

        for (int cellIndex = 0; cellIndex < cells.Count; cellIndex++)
        {
            if (inDegree[cellIndex] == 0)
            {
                queue.Enqueue(cellIndex);
            }
        }

        // Longest-path ranks: sources (in-degree 0) stay layer 0 (left);
        // each inter-cell hop shifts the target one column to the right.
        while (queue.Count > 0)
        {
            int current = queue.Dequeue();

            if (visited[current])
            {
                continue;
            }

            visited[current] = true;

            foreach (int target in outgoing[current].OrderBy(index => index))
            {
                int nextLayer = layerByCell[current] + 1;

                if (nextLayer > layerByCell[target])
                {
                    layerByCell[target] = nextLayer;
                }

                inDegree[target]--;

                if (inDegree[target] == 0)
                {
                    queue.Enqueue(target);
                }
            }
        }

        int maxLayer = layerByCell.Length == 0 ? 0 : layerByCell.Max();

        return new CellRank(layerByCell, visited, maxLayer);
    }

    private static Dictionary<string, int> BuildNodeCellIndex(
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> cells)
    {
        Dictionary<string, int> cellIndexByNodeId = new(StringComparer.Ordinal);

        for (int cellIndex = 0; cellIndex < cells.Count; cellIndex++)
        {
            DiagramResourceGroupPacker.ResourceGroupCell cell = cells[cellIndex];

            if (cell is null || cell.Nodes is null)
            {
                continue;
            }

            foreach (DiagramNode node in cell.Nodes)
            {
                if (node is null || string.IsNullOrWhiteSpace(node.NodeId))
                {
                    continue;
                }

                cellIndexByNodeId.TryAdd(node.NodeId, cellIndex);
            }
        }

        return cellIndexByNodeId;
    }

    private sealed record CellRank(int[] LayerByCell, bool[] Visited, int MaxLayer);
}
