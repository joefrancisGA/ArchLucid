using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Reorders nodes inside one layer to reduce straight-edge crossings with neighbors.</summary>
public static class DiagramLayerCrossingOrder
{
    private const double LayerXSpacing = 1.0d;

    public static List<DiagramNode> OrderLayer(
        IReadOnlyList<DiagramNode> layerNodes,
        IReadOnlyList<DiagramNode>? previousLayer,
        IReadOnlyList<DiagramNode>? nextLayer,
        IReadOnlyList<DiagramEdge> relevantEdges,
        int maxPasses = 4)
    {
        ArgumentNullException.ThrowIfNull(layerNodes);
        ArgumentNullException.ThrowIfNull(relevantEdges);

        if (layerNodes.Count <= 1)
        {
            return layerNodes.ToList();
        }

        List<DiagramNode> currentOrder = layerNodes
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal)
            .ToList();
        int bestCrossings = CountLayerCrossings(currentOrder, previousLayer, nextLayer, relevantEdges);

        for (int pass = 0; pass < maxPasses; pass++)
        {
            bool usePrevious = pass % 2 == 0;
            IReadOnlyList<DiagramNode>? adjacentLayer = usePrevious ? previousLayer : nextLayer;

            if (adjacentLayer is null || adjacentLayer.Count == 0)
            {
                adjacentLayer = usePrevious ? nextLayer : previousLayer;
            }

            if (adjacentLayer is null || adjacentLayer.Count == 0)
            {
                break;
            }

            List<DiagramNode> candidateOrder = OrderByBarycenter(currentOrder, adjacentLayer, relevantEdges);
            int candidateCrossings = CountLayerCrossings(candidateOrder, previousLayer, nextLayer, relevantEdges);

            if (candidateCrossings < bestCrossings)
            {
                currentOrder = candidateOrder;
                bestCrossings = candidateCrossings;
                continue;
            }

            break;
        }

        return currentOrder;
    }

    public static List<DiagramNode> OrderByAdjacentLayer(
        IReadOnlyList<DiagramNode> layerNodes,
        IReadOnlyList<DiagramNode>? adjacentLayer,
        bool adjacentIsPrevious,
        IReadOnlyList<DiagramNode>? otherAdjacentLayer,
        IReadOnlyList<DiagramEdge> relevantEdges,
        int maxPasses = 4)
    {
        ArgumentNullException.ThrowIfNull(layerNodes);
        ArgumentNullException.ThrowIfNull(relevantEdges);

        if (layerNodes.Count <= 1 || adjacentLayer is null || adjacentLayer.Count == 0)
        {
            return layerNodes.ToList();
        }

        IReadOnlyList<DiagramNode>? previousLayer = adjacentIsPrevious ? adjacentLayer : otherAdjacentLayer;
        IReadOnlyList<DiagramNode>? nextLayer = adjacentIsPrevious ? otherAdjacentLayer : adjacentLayer;
        List<DiagramNode> currentOrder = layerNodes
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal)
            .ToList();
        int bestCrossings = CountLayerCrossings(currentOrder, previousLayer, nextLayer, relevantEdges);

        for (int pass = 0; pass < maxPasses; pass++)
        {
            List<DiagramNode> candidateOrder = OrderByBarycenter(currentOrder, adjacentLayer, relevantEdges);
            int candidateCrossings = CountLayerCrossings(candidateOrder, previousLayer, nextLayer, relevantEdges);

            if (candidateCrossings < bestCrossings)
            {
                currentOrder = candidateOrder;
                bestCrossings = candidateCrossings;
                continue;
            }

            break;
        }

        return currentOrder;
    }

    private static List<DiagramNode> OrderByBarycenter(
        IReadOnlyList<DiagramNode> layerNodes,
        IReadOnlyList<DiagramNode> adjacentLayer,
        IReadOnlyList<DiagramEdge> relevantEdges)
    {
        Dictionary<string, int> adjacentIndexById = adjacentLayer
            .Select((node, index) => new { node.NodeId, Index = index })
            .ToDictionary(item => item.NodeId, item => item.Index, StringComparer.Ordinal);
        Dictionary<string, List<string>> neighborsById = BuildUndirectedNeighborMap(layerNodes, adjacentLayer, relevantEdges);
        List<(DiagramNode Node, double Barycenter, int OrderKey, string NodeId)> ranked = [];

        foreach (DiagramNode node in layerNodes)
        {
            double barycenter = layerNodes
                .Select((candidate, index) => new { candidate.NodeId, Index = index })
                .Where(item => string.Equals(item.NodeId, node.NodeId, StringComparison.Ordinal))
                .Select(item => (double)item.Index)
                .First();

            if (neighborsById.TryGetValue(node.NodeId, out List<string>? neighbors) && neighbors.Count > 0)
            {
                List<int> neighborIndices = [];

                foreach (string neighborId in neighbors)
                {
                    if (adjacentIndexById.TryGetValue(neighborId, out int neighborIndex))
                    {
                        neighborIndices.Add(neighborIndex);
                    }
                }

                if (neighborIndices.Count > 0)
                {
                    barycenter = neighborIndices.Average();
                }
            }

            ranked.Add((node, barycenter, node.OrderKey, node.NodeId));
        }

        return ranked
            .OrderBy(item => item.Barycenter)
            .ThenBy(item => item.OrderKey)
            .ThenBy(item => item.NodeId, StringComparer.Ordinal)
            .Select(item => item.Node)
            .ToList();
    }

    private static Dictionary<string, List<string>> BuildUndirectedNeighborMap(
        IReadOnlyList<DiagramNode> layerNodes,
        IReadOnlyList<DiagramNode> adjacentLayer,
        IReadOnlyList<DiagramEdge> relevantEdges)
    {
        HashSet<string> layerIds = layerNodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);
        HashSet<string> adjacentIds = adjacentLayer
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);
        Dictionary<string, List<string>> neighborsById = new(StringComparer.Ordinal);

        foreach (DiagramNode node in layerNodes)
        {
            neighborsById[node.NodeId] = [];
        }

        foreach (DiagramEdge edge in relevantEdges)
        {
            bool fromInLayer = layerIds.Contains(edge.FromNodeId);
            bool toInLayer = layerIds.Contains(edge.ToNodeId);
            bool fromInAdjacent = adjacentIds.Contains(edge.FromNodeId);
            bool toInAdjacent = adjacentIds.Contains(edge.ToNodeId);

            if (fromInLayer && toInAdjacent)
            {
                neighborsById[edge.FromNodeId].Add(edge.ToNodeId);
                continue;
            }

            if (toInLayer && fromInAdjacent)
            {
                neighborsById[edge.ToNodeId].Add(edge.FromNodeId);
            }
        }

        return neighborsById;
    }

    private static int CountLayerCrossings(
        IReadOnlyList<DiagramNode> layerNodes,
        IReadOnlyList<DiagramNode>? previousLayer,
        IReadOnlyList<DiagramNode>? nextLayer,
        IReadOnlyList<DiagramEdge> relevantEdges)
    {
        Dictionary<string, (double X, double Y)> positions = BuildPositions(layerNodes, previousLayer, nextLayer);
        HashSet<string> scopedNodeIds = positions.Keys.ToHashSet(StringComparer.Ordinal);
        List<IReadOnlyList<(double X1, double Y1, double X2, double Y2)>> routes = [];

        foreach (DiagramEdge edge in relevantEdges)
        {
            if (!scopedNodeIds.Contains(edge.FromNodeId) || !scopedNodeIds.Contains(edge.ToNodeId))
            {
                continue;
            }

            if (!positions.TryGetValue(edge.FromNodeId, out (double FromX, double FromY) fromPosition)
                || !positions.TryGetValue(edge.ToNodeId, out (double ToX, double ToY) toPosition))
            {
                continue;
            }

            routes.Add([(fromPosition.FromX, fromPosition.FromY, toPosition.ToX, toPosition.ToY)]);
        }

        return DiagramEdgeCrossingCounter.Count(routes);
    }

    private static Dictionary<string, (double X, double Y)> BuildPositions(
        IReadOnlyList<DiagramNode> layerNodes,
        IReadOnlyList<DiagramNode>? previousLayer,
        IReadOnlyList<DiagramNode>? nextLayer)
    {
        Dictionary<string, (double X, double Y)> positions = new(StringComparer.Ordinal);

        if (previousLayer is not null)
        {
            for (int index = 0; index < previousLayer.Count; index++)
            {
                positions[previousLayer[index].NodeId] = (0.0d, index + 0.5d);
            }
        }

        for (int index = 0; index < layerNodes.Count; index++)
        {
            positions[layerNodes[index].NodeId] = (LayerXSpacing, index + 0.5d);
        }

        if (nextLayer is not null)
        {
            for (int index = 0; index < nextLayer.Count; index++)
            {
                positions[nextLayer[index].NodeId] = (LayerXSpacing * 2.0d, index + 0.5d);
            }
        }

        return positions;
    }
}
