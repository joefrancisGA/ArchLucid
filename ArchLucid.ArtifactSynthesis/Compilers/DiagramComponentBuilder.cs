using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
/// Union-find connected components over visible diagram edges.
/// Shared by Mermaid packing (<c>~~~</c>) and explicit forest layout.
/// </summary>
internal static class DiagramComponentBuilder
{
    internal static List<List<DiagramNode>> BuildConnectedComponents(
        IReadOnlyList<DiagramNode> nodes,
        IReadOnlyList<DiagramEdge> edges)
    {
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(edges);

        Dictionary<string, DiagramNode> nodesById = nodes.ToDictionary(
            node => node.NodeId,
            StringComparer.Ordinal);
        Dictionary<string, string> parent = nodesById.Keys.ToDictionary(
            nodeId => nodeId,
            nodeId => nodeId,
            StringComparer.Ordinal);

        foreach (DiagramEdge edge in DiagramEdgeVisibility.VisibleEdges(edges))
        {
            if (!nodesById.ContainsKey(edge.FromNodeId) || !nodesById.ContainsKey(edge.ToNodeId))
            {
                continue;
            }

            Union(parent, edge.FromNodeId, edge.ToNodeId);
        }

        Dictionary<string, List<DiagramNode>> grouped = new(StringComparer.Ordinal);

        foreach (DiagramNode node in nodes)
        {
            string root = Find(parent, node.NodeId);

            if (!grouped.TryGetValue(root, out List<DiagramNode>? members))
            {
                members = [];
                grouped[root] = members;
            }

            members.Add(node);
        }

        return grouped.Values
            .Select(component => component
                .OrderBy(node => node.OrderKey)
                .ThenBy(node => node.NodeId, StringComparer.Ordinal)
                .ToList())
            .ToList();
    }

    private static string Find(Dictionary<string, string> parent, string nodeId)
    {
        if (!parent.TryGetValue(nodeId, out string? root))
        {
            return nodeId;
        }

        if (!string.Equals(root, nodeId, StringComparison.Ordinal))
        {
            root = Find(parent, root);
            parent[nodeId] = root;
        }

        return root;
    }

    private static void Union(Dictionary<string, string> parent, string leftId, string rightId)
    {
        string leftRoot = Find(parent, leftId);
        string rightRoot = Find(parent, rightId);

        if (!string.Equals(leftRoot, rightRoot, StringComparison.Ordinal))
        {
            parent[rightRoot] = leftRoot;
        }
    }
}
