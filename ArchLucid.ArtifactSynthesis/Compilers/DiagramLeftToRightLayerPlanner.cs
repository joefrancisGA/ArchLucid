using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
/// Longest-path ranks for a connected component so forest layout can paint
/// larger graphs left-to-right instead of one tall stack.
/// </summary>
internal static class DiagramLeftToRightLayerPlanner
{
    /// <summary>
    /// Peering pairs and triples stay top-down (human forest of short columns).
    /// Four or more nodes in one component switch to left-to-right ranks.
    /// </summary>
    public const int VerticalLayoutMaxNodeCount = 3;

    public static bool ShouldLayoutLeftToRight(IReadOnlyList<DiagramNode> component)
    {
        ArgumentNullException.ThrowIfNull(component);

        return component.Count > VerticalLayoutMaxNodeCount;
    }

    public static IReadOnlyList<IReadOnlyList<DiagramNode>> AssignLayers(
        IReadOnlyList<DiagramNode> component,
        IReadOnlyList<DiagramEdge> visibleEdges)
    {
        ArgumentNullException.ThrowIfNull(component);
        ArgumentNullException.ThrowIfNull(visibleEdges);

        if (component.Count == 0)
        {
            return [];
        }

        HashSet<string> memberIds = component
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);
        List<DiagramEdge> internalEdges = visibleEdges
            .Where(edge => memberIds.Contains(edge.FromNodeId) && memberIds.Contains(edge.ToNodeId))
            .ToList();
        Dictionary<string, int> inDegree = component.ToDictionary(
            node => node.NodeId,
            _ => 0,
            StringComparer.Ordinal);
        Dictionary<string, List<string>> outgoing = new(StringComparer.Ordinal);

        foreach (DiagramEdge edge in internalEdges)
        {
            inDegree[edge.ToNodeId]++;

            if (!outgoing.TryGetValue(edge.FromNodeId, out List<string>? targets))
            {
                targets = [];
                outgoing[edge.FromNodeId] = targets;
            }

            targets.Add(edge.ToNodeId);
        }

        Dictionary<string, int> layerById = component.ToDictionary(
            node => node.NodeId,
            _ => 0,
            StringComparer.Ordinal);
        Queue<DiagramNode> queue = new(component
            .Where(node => inDegree[node.NodeId] == 0)
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal));
        HashSet<string> visited = new(StringComparer.Ordinal);

        while (queue.Count > 0)
        {
            DiagramNode current = queue.Dequeue();

            if (!visited.Add(current.NodeId))
            {
                continue;
            }

            if (!outgoing.TryGetValue(current.NodeId, out List<string>? targets))
            {
                continue;
            }

            foreach (string targetId in targets.OrderBy(id => id, StringComparer.Ordinal))
            {
                int nextLayer = layerById[current.NodeId] + 1;

                if (nextLayer > layerById[targetId])
                {
                    layerById[targetId] = nextLayer;
                }

                inDegree[targetId]--;

                if (inDegree[targetId] == 0)
                {
                    DiagramNode? targetNode = component.FirstOrDefault(node =>
                        string.Equals(node.NodeId, targetId, StringComparison.Ordinal));

                    if (targetNode is not null)
                    {
                        queue.Enqueue(targetNode);
                    }
                }
            }
        }

        foreach (DiagramNode node in component.Where(node => !visited.Contains(node.NodeId)))
        {
            layerById[node.NodeId] = 0;
        }

        int layerCount = layerById.Values.Max() + 1;
        List<List<DiagramNode>> layers = Enumerable.Range(0, layerCount)
            .Select(_ => new List<DiagramNode>())
            .ToList();

        foreach (DiagramNode node in component
                     .OrderBy(node => node.OrderKey)
                     .ThenBy(node => node.NodeId, StringComparer.Ordinal))
        {
            layers[layerById[node.NodeId]].Add(node);
        }

        List<IReadOnlyList<DiagramNode>> result = [];

        foreach (List<DiagramNode> layer in layers)
        {
            if (layer.Count == 0)
            {
                continue;
            }

            result.Add(layer);
        }

        return result;
    }
}
