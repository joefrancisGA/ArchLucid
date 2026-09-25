using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Collapses unconnected singleton resource groups into one visual summary cell.</summary>
public static class DiagramForestSingletonTailPlanner
{
    public const int SingletonThreshold = 8;

    public sealed record Result(
        IReadOnlyList<DiagramNode> Nodes,
        IReadOnlyList<DiagramEdge> Edges);

    public static Result Apply(
        string title,
        IReadOnlyList<DiagramNode> nodes,
        IReadOnlyList<DiagramEdge> edges)
    {
        ArgumentNullException.ThrowIfNull(title);
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(edges);

        if (!ShouldCollapse(title))
        {
            return new Result(nodes, edges);
        }

        Dictionary<string, List<DiagramNode>> groups = nodes
            .Where(node => !string.IsNullOrWhiteSpace(node.ArmResourceGroup))
            .GroupBy(node => node.ArmResourceGroup!, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.ToList(), StringComparer.OrdinalIgnoreCase);
        List<DiagramNode> candidates = groups
            .Where(group => group.Value.Count == 1)
            .SelectMany(group => group.Value)
            .Where(node => !HasCitedInterGroupEdge(node, nodes, edges))
            .Where(node => string.IsNullOrWhiteSpace(node.SubgraphId))
            .ToList();

        if (candidates.Count <= SingletonThreshold)
        {
            return new Result(nodes, edges);
        }

        HashSet<string> candidateIds = candidates.Select(node => node.NodeId).ToHashSet(StringComparer.Ordinal);
        DiagramNode summary = new()
        {
            NodeId = "other-resource-groups-rollup",
            Label = $"Other resource groups ({candidates.Count})",
            NodeType = "InventoryRollup",
            OrderKey = candidates.Min(node => node.OrderKey),
            ArmResourceGroup = "Other resource groups",
        };
        List<DiagramNode> retainedNodes = nodes
            .Where(node => !candidateIds.Contains(node.NodeId))
            .Append(summary)
            .ToList();
        List<DiagramEdge> retainedEdges = edges
            .Where(edge => !candidateIds.Contains(edge.FromNodeId) && !candidateIds.Contains(edge.ToNodeId))
            .ToList();

        return new Result(retainedNodes, retainedEdges);
    }

    private static bool ShouldCollapse(string title)
    {
        return !title.Contains("(ResourceGroup)", StringComparison.OrdinalIgnoreCase)
            && !title.Contains("(SelectedResources)", StringComparison.OrdinalIgnoreCase)
            && !title.Contains("(DependencyNeighborhood)", StringComparison.OrdinalIgnoreCase);
    }

    private static bool HasCitedInterGroupEdge(
        DiagramNode node,
        IReadOnlyList<DiagramNode> nodes,
        IReadOnlyList<DiagramEdge> edges)
    {
        string? groupName = node.ArmResourceGroup;
        Dictionary<string, DiagramNode> nodesById = nodes.ToDictionary(candidate => candidate.NodeId, StringComparer.Ordinal);

        return edges.Any(edge =>
            (string.Equals(edge.FromNodeId, node.NodeId, StringComparison.Ordinal)
                || string.Equals(edge.ToNodeId, node.NodeId, StringComparison.Ordinal))
            && !string.Equals(
                edge.InferenceSource,
                GraphEdgeInferenceSources.InventoryResourceGroupCollocation,
                StringComparison.OrdinalIgnoreCase)
            && TryGetOtherNode(edge, node, nodesById, out DiagramNode? other)
            && other is not null
            && !string.Equals(groupName, other.ArmResourceGroup, StringComparison.OrdinalIgnoreCase));
    }

    private static bool TryGetOtherNode(
        DiagramEdge edge,
        DiagramNode node,
        IReadOnlyDictionary<string, DiagramNode> nodesById,
        out DiagramNode? other)
    {
        string otherId = string.Equals(edge.FromNodeId, node.NodeId, StringComparison.Ordinal)
            ? edge.ToNodeId
            : edge.FromNodeId;

        return nodesById.TryGetValue(otherId, out other);
    }
}
