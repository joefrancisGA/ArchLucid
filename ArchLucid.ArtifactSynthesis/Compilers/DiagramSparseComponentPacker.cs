using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
/// When a diagram has real edges but multiple disconnected components, dagre spreads each
/// tiny peering tree across the canvas. Wrapping components in packing subgraphs and linking
/// representatives with invisible <c>~~~</c> edges steers a viewport-shaped grid without
/// hiding real arrows.
/// </summary>
internal static class DiagramSparseComponentPacker
{
    public const string PackingSubgraphIdPrefix = "alpack_";

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

        bool hasNonPackingSubgraphs = ast.Subgraphs.Any(subgraph => !IsPackingSubgraph(subgraph));

        if (hasNonPackingSubgraphs)
        {
            PackInsideExistingSubgraphs(ast);
            return;
        }

        PackFlatGraph(ast);
    }

    public static bool IsPackingSubgraph(DiagramSubgraph subgraph)
    {
        ArgumentNullException.ThrowIfNull(subgraph);

        return subgraph.SubgraphId.StartsWith(PackingSubgraphIdPrefix, StringComparison.Ordinal);
    }

    private static void PackFlatGraph(DiagramAst ast)
    {
        List<List<DiagramNode>> components = BuildComponents(ast.Nodes, ast.Edges);

        if (components.Count <= 1)
        {
            return;
        }

        WrapComponentsInPackingSubgraphs(ast, components, parentSubgraphId: null);
        AppendRepresentativeGridLinks(ast, components);
    }

    private static void PackInsideExistingSubgraphs(DiagramAst ast)
    {
        foreach (DiagramSubgraph subgraph in ast.Subgraphs.Where(candidate => !IsPackingSubgraph(candidate)).ToList())
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

            if (components.Count <= 1)
            {
                continue;
            }

            AppendRepresentativeGridLinks(ast, components);
        }
    }

    private static void WrapComponentsInPackingSubgraphs(
        DiagramAst ast,
        IReadOnlyList<List<DiagramNode>> components,
        string? parentSubgraphId)
    {
        int orderKey = ast.Subgraphs.Count;

        for (int index = 0; index < components.Count; index++)
        {
            string subgraphId = $"{PackingSubgraphIdPrefix}{index}";
            ast.Subgraphs.Add(new DiagramSubgraph
            {
                SubgraphId = subgraphId,
                // Mermaid rejects empty labels; chrome is hidden via renderer style + host CSS.
                Label = " ",
                ParentSubgraphId = parentSubgraphId,
                OrderKey = orderKey++,
            });

            foreach (DiagramNode node in components[index])
            {
                node.SubgraphId = subgraphId;
            }
        }
    }

    private static void AppendRepresentativeGridLinks(
        DiagramAst ast,
        IReadOnlyList<List<DiagramNode>> components)
    {
        List<DiagramNode> representatives = components
            .Select(SelectRepresentative)
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal)
            .ToList();

        foreach (DiagramEdge link in DiagramPeerGridPlanner.BuildGridLinks(representatives))
        {
            ast.Edges.Add(link);
        }
    }

    private static DiagramNode SelectRepresentative(IReadOnlyList<DiagramNode> component)
    {
        return component
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal)
            .First();
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
            .OrderBy(component => component[0].OrderKey)
            .ThenBy(component => component[0].NodeId, StringComparer.Ordinal)
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
