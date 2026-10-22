using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Collapses isolated singleton resource-group nodes into one summary card (IDX-08).</summary>
public static class DiagramForestSingletonTailPlanner
{
    public const int SingletonThreshold = 8;

    public const string CollapsedTailNodeId = "collapsed-singleton-resource-groups";

    public const string CollapsedTailResourceGroupName = "__collapsed-singleton-tail__";

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

        if (!DiagramForestInventoryTitleParser.TryParseMode(title, out DiagramMode mode)
            || !DiagramForestInventoryTitleParser.IsSubscriptionScopedMode(mode)
            || mode is DiagramMode.DataFlow or DiagramMode.DataArchitecture)
        {
            return new Result(nodes, edges);
        }

        Dictionary<string, DiagramNode> nodesById = nodes
            .Where(node => !string.IsNullOrWhiteSpace(node.NodeId))
            .ToDictionary(node => node.NodeId, StringComparer.Ordinal);
        HashSet<string> interRgCitedNodeIds = ResolveInterResourceGroupCitedNodeIds(nodesById, edges);
        Dictionary<string, List<DiagramNode>> nodesByGroup = nodes
            .Where(node => !string.IsNullOrWhiteSpace(node.ArmResourceGroup))
            .GroupBy(node => node.ArmResourceGroup!, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.ToList(), StringComparer.OrdinalIgnoreCase);

        List<DiagramNode> singletonCandidates = [];

        foreach ((string groupName, List<DiagramNode> members) in nodesByGroup)
        {
            if (members.Count != 1)
            {
                continue;
            }

            DiagramNode member = members[0];

            if (interRgCitedNodeIds.Contains(member.NodeId))
            {
                continue;
            }

            singletonCandidates.Add(member);
        }

        if (singletonCandidates.Count < SingletonThreshold)
        {
            return new Result(nodes, edges);
        }

        HashSet<string> collapsedIds = singletonCandidates
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);
        List<DiagramNode> retained = nodes
            .Where(node => !collapsedIds.Contains(node.NodeId))
            .ToList();
        List<string> memberNames = singletonCandidates
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal)
            .Select(node => node.Label)
            .Take(3)
            .ToList();

        retained.Add(new DiagramNode
        {
            NodeId = CollapsedTailNodeId,
            Label = $"Other resource groups ({singletonCandidates.Count})",
            NodeType = "TopologyResource",
            OrderKey = singletonCandidates.Max(node => node.OrderKey) + 1,
            ArmResourceGroup = CollapsedTailResourceGroupName,
            IsCollapsedResourceGroupTail = true,
            CollapsedResourceGroupTailMemberNames = memberNames,
        });

        List<DiagramEdge> retainedEdges = edges
            .Where(edge => !collapsedIds.Contains(edge.FromNodeId) && !collapsedIds.Contains(edge.ToNodeId))
            .ToList();

        return new Result(retained, retainedEdges);
    }

    private static HashSet<string> ResolveInterResourceGroupCitedNodeIds(
        IReadOnlyDictionary<string, DiagramNode> nodesById,
        IReadOnlyList<DiagramEdge> edges)
    {
        HashSet<string> cited = new(StringComparer.Ordinal);

        foreach (DiagramEdge edge in edges)
        {
            if (!DiagramForestDiagramEdgeCitedHop.IsCitedHop(edge))
            {
                continue;
            }

            if (!nodesById.TryGetValue(edge.FromNodeId, out DiagramNode? from)
                || !nodesById.TryGetValue(edge.ToNodeId, out DiagramNode? to))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(from.ArmResourceGroup)
                || string.IsNullOrWhiteSpace(to.ArmResourceGroup)
                || string.Equals(from.ArmResourceGroup, to.ArmResourceGroup, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            cited.Add(from.NodeId);
            cited.Add(to.NodeId);
        }

        return cited;
    }
}
