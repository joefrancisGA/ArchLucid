using ArchLucid.ArtifactSynthesis;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Suppresses duplicate on-path edge labels within a connected component.</summary>
public static class DiagramForestEdgeLabelCollapse
{
    public static HashSet<string> ResolveSuppressedEdgeKeys(
        IReadOnlyList<DiagramNode> nodes,
        IReadOnlyList<DiagramEdge> visibleEdges)
    {
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(visibleEdges);

        Dictionary<string, string> nodeToComponent = BuildComponentRoots(nodes, visibleEdges);
        Dictionary<string, List<DiagramEdge>> edgesByComponent = new(StringComparer.Ordinal);
        HashSet<string> suppressed = new(StringComparer.Ordinal);

        foreach (DiagramEdge edge in visibleEdges)
        {
            if (!nodeToComponent.TryGetValue(edge.FromNodeId, out string? fromRoot)
                || !nodeToComponent.TryGetValue(edge.ToNodeId, out string? toRoot)
                || !string.Equals(fromRoot, toRoot, StringComparison.Ordinal))
            {
                continue;
            }

            if (!edgesByComponent.TryGetValue(fromRoot, out List<DiagramEdge>? members))
            {
                members = [];
                edgesByComponent[fromRoot] = members;
            }

            members.Add(edge);
        }

        foreach (List<DiagramEdge> componentEdges in edgesByComponent.Values)
        {
            if (componentEdges.Count < 2)
            {
                continue;
            }

            List<string> labels = componentEdges
                .Select(edge => edge.Label?.Trim() ?? string.Empty)
                .Where(label => label.Length > 0)
                .ToList();

            if (labels.Count != componentEdges.Count)
            {
                continue;
            }

            string firstLabel = labels[0];

            if (!labels.All(label => string.Equals(label, firstLabel, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            foreach (DiagramEdge edge in componentEdges)
            {
                suppressed.Add(EdgeKey(edge));
            }
        }

        return suppressed;
    }

    public static bool IsPeeringEdge(DiagramEdge edge)
    {
        ArgumentNullException.ThrowIfNull(edge);

        return string.Equals(edge.Label, "peering", StringComparison.OrdinalIgnoreCase);
    }

    public static bool ShouldSuppressOnPathLabel(DiagramEdge edge, HashSet<string> collapsedEdgeKeys)
    {
        ArgumentNullException.ThrowIfNull(edge);
        ArgumentNullException.ThrowIfNull(collapsedEdgeKeys);

        if (DiagramEdgeVisualKindResolver.From(edge.ProvenanceKind, edge.InferenceSource) == DiagramEdgeVisualKind.Declared)
        {
            return false;
        }

        if (collapsedEdgeKeys.Contains(EdgeKey(edge)))
        {
            return true;
        }

        return IsPeeringEdge(edge);
    }

    private static Dictionary<string, string> BuildComponentRoots(
        IReadOnlyList<DiagramNode> nodes,
        IReadOnlyList<DiagramEdge> visibleEdges)
    {
        List<List<DiagramNode>> components = DiagramComponentBuilder.BuildConnectedComponents(nodes, visibleEdges);
        Dictionary<string, string> nodeToComponent = new(StringComparer.Ordinal);

        foreach (List<DiagramNode> component in components)
        {
            string root = component
                .OrderBy(node => node.OrderKey)
                .ThenBy(node => node.NodeId, StringComparer.Ordinal)
                .First()
                .NodeId;

            foreach (DiagramNode node in component)
            {
                nodeToComponent[node.NodeId] = root;
            }
        }

        return nodeToComponent;
    }

    public static string EdgeKey(DiagramEdge edge)
    {
        return $"{edge.FromNodeId}\u2192{edge.ToNodeId}";
    }
}
