using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Hub-and-spoke placement for high-degree connected components.</summary>
public static class DiagramHubSpokeLayerPlanner
{
    public static bool ShouldLayoutHubSpoke(
        IReadOnlyList<DiagramNode> component,
        IReadOnlyList<DiagramEdge> visibleEdges)
    {
        ArgumentNullException.ThrowIfNull(component);
        ArgumentNullException.ThrowIfNull(visibleEdges);

        if (component.Count < 4)
        {
            return false;
        }

        DiagramNode? hub = ResolveHub(component, visibleEdges);

        return hub is not null && ResolveDegree(hub.NodeId, component, visibleEdges) >= 3;
    }

    public static DiagramNode? ResolveHub(
        IReadOnlyList<DiagramNode> component,
        IReadOnlyList<DiagramEdge> visibleEdges)
    {
        ArgumentNullException.ThrowIfNull(component);
        ArgumentNullException.ThrowIfNull(visibleEdges);

        DiagramNode? best = null;
        int bestDegree = 0;

        foreach (DiagramNode node in component)
        {
            int degree = ResolveDegree(node.NodeId, component, visibleEdges);

            if (degree < 3)
            {
                continue;
            }

            if (degree > bestDegree
                || (degree == bestDegree && best is not null
                    && (node.OrderKey < best.OrderKey
                        || (node.OrderKey == best.OrderKey
                            && string.Compare(node.NodeId, best.NodeId, StringComparison.Ordinal) < 0))))
            {
                best = node;
                bestDegree = degree;
            }
        }

        return best;
    }

    public static int ResolveDegree(
        string nodeId,
        IReadOnlyList<DiagramNode> component,
        IReadOnlyList<DiagramEdge> visibleEdges)
    {
        HashSet<string> memberIds = component
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);
        HashSet<string> neighbors = new(StringComparer.Ordinal);

        foreach (DiagramEdge edge in visibleEdges)
        {
            if (string.Equals(edge.FromNodeId, nodeId, StringComparison.Ordinal)
                && memberIds.Contains(edge.ToNodeId))
            {
                neighbors.Add(edge.ToNodeId);
            }
            else if (string.Equals(edge.ToNodeId, nodeId, StringComparison.Ordinal)
                && memberIds.Contains(edge.FromNodeId))
            {
                neighbors.Add(edge.FromNodeId);
            }
        }

        return neighbors.Count;
    }

    public static IReadOnlyList<DiagramNode> OrderSpokes(
        DiagramNode hub,
        IReadOnlyList<DiagramNode> component,
        IReadOnlyList<DiagramEdge> visibleEdges)
    {
        ArgumentNullException.ThrowIfNull(hub);
        ArgumentNullException.ThrowIfNull(component);
        ArgumentNullException.ThrowIfNull(visibleEdges);

        HashSet<string> neighborIds = new(StringComparer.Ordinal);
        HashSet<string> memberIds = component
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        foreach (DiagramEdge edge in visibleEdges)
        {
            if (string.Equals(edge.FromNodeId, hub.NodeId, StringComparison.Ordinal)
                && memberIds.Contains(edge.ToNodeId))
            {
                neighborIds.Add(edge.ToNodeId);
            }
            else if (string.Equals(edge.ToNodeId, hub.NodeId, StringComparison.Ordinal)
                && memberIds.Contains(edge.FromNodeId))
            {
                neighborIds.Add(edge.FromNodeId);
            }
        }

        List<DiagramNode> spokes = component
            .Where(node => neighborIds.Contains(node.NodeId))
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal)
            .ToList();
        List<DiagramNode> isolated = component
            .Where(node => !string.Equals(node.NodeId, hub.NodeId, StringComparison.Ordinal)
                && !neighborIds.Contains(node.NodeId))
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal)
            .ToList();

        spokes.AddRange(isolated);

        return spokes;
    }
}
