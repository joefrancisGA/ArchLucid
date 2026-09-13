using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
/// When a diagram has real edges but multiple disconnected components, dagre spreads
/// each tiny peering tree across one wide rank. Layout-only <c>~~~</c> links from a
/// previous-row sink to the next-row heads pack the forest in a viewport-shaped TD
/// grid. Do not wrap components in subgraphs — Mermaid 11 extracts edge-free
/// subgraphs as LR clusters with hard-coded 50/50 spacing.
/// </summary>
internal static class DiagramSparseComponentPacker
{
    public static bool IsPackingSubgraph(DiagramSubgraph subgraph)
    {
        ArgumentNullException.ThrowIfNull(subgraph);

        return subgraph.SubgraphId.StartsWith("alpack_", StringComparison.Ordinal);
    }

    public static void Pack(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        if (ast.Nodes.Count <= 1)
        {
            return;
        }

        if (DiagramEdgeVisibility.CountVisible(ast.Edges) == 0)
        {
            // IDL-02 peer-grid owns the zero-relationship case.
            return;
        }

        if (ast.Subgraphs.Count > 0)
        {
            PackInsideExistingSubgraphs(ast);
            return;
        }

        PackFlatGraph(ast);
    }

    private static void PackFlatGraph(DiagramAst ast)
    {
        List<List<DiagramNode>> components = BuildComponents(ast.Nodes, ast.Edges);
        AppendAlignmentLinks(ast, components);
    }

    private static void PackInsideExistingSubgraphs(DiagramAst ast)
    {
        foreach (DiagramSubgraph subgraph in ast.Subgraphs.ToList())
        {
            List<DiagramNode> members = ast.Nodes
                .Where(node => string.Equals(node.SubgraphId, subgraph.SubgraphId, StringComparison.Ordinal))
                .OrderBy(node => node.OrderKey)
                .ThenBy(node => node.NodeId, StringComparer.Ordinal)
                .ToList();

            if (members.Count <= 1)
            {
                continue;
            }

            List<List<DiagramNode>> components = BuildComponents(members, ast.Edges);
            AppendAlignmentLinks(ast, components);
        }
    }

    private static void AppendAlignmentLinks(DiagramAst ast, IReadOnlyList<List<DiagramNode>> components)
    {
        if (components.Count <= 1)
        {
            return;
        }

        IReadOnlyList<DiagramEdge> visibleEdges = DiagramEdgeVisibility.VisibleEdges(ast.Edges).ToList();

        foreach (DiagramEdge link in DiagramComponentRowPlanner.BuildAlignmentLinks(components, visibleEdges))
        {
            ast.Edges.Add(link);
        }
    }

    private static List<List<DiagramNode>> BuildComponents(
        IReadOnlyList<DiagramNode> nodes,
        IReadOnlyList<DiagramEdge> edges)
    {
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
