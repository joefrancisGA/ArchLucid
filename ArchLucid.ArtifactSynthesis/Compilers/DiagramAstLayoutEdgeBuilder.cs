using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal static class DiagramAstLayoutEdgeBuilder
{
    public static void EnsureLayoutEdgesWhenEmpty(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        if (DiagramEdgeVisibility.CountVisible(ast.Edges) > 0 || ast.Nodes.Count <= 1)
        {
            return;
        }

        if (ast.Subgraphs.Count == 0)
        {
            AppendGridLinks(ast, ast.Nodes);
            return;
        }

        EnsureSubgraphGridLinks(ast);
    }

    public static void AddDerivedVmVnetLayoutEdges(
        DiagramAst ast,
        GraphSnapshot graph,
        DiagramMode mode,
        IReadOnlyDictionary<string, string> nodeIdMap)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(nodeIdMap);

        if (mode is not DiagramMode.Network and not DiagramMode.Executive)
        {
            return;
        }

        Dictionary<string, List<string>> connectsTo = BuildConnectsToAdjacency(graph);
        HashSet<string> derivedEdgeKeys = new(StringComparer.Ordinal);

        foreach (GraphNode node in graph.Nodes)
        {
            string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);

            if (!armType.Contains("virtualMachines", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!nodeIdMap.TryGetValue(node.NodeId, out string? vmMermaidId))
            {
                continue;
            }

            HashSet<string> vnetNodeIds = DiagramAstVnetTopologyResolver.ResolveVnetNodeIdsForVirtualMachine(
                node.NodeId,
                connectsTo,
                graph);

            foreach (string vnetNodeId in vnetNodeIds)
            {
                if (!nodeIdMap.TryGetValue(vnetNodeId, out string? vnetMermaidId))
                {
                    continue;
                }

                string edgeKey = $"{vmMermaidId}|{vnetMermaidId}";

                if (!derivedEdgeKeys.Add(edgeKey))
                {
                    continue;
                }

                ast.Edges.Add(new DiagramEdge
                {
                    FromNodeId = vmMermaidId,
                    ToNodeId = vnetMermaidId,
                    Label = "in",
                });
            }
        }
    }

    private static void EnsureSubgraphGridLinks(DiagramAst ast)
    {
        HashSet<string> subgraphIds = ast.Subgraphs
            .Select(subgraph => subgraph.SubgraphId)
            .ToHashSet(StringComparer.Ordinal);
        bool addedSubgraphGridLinks = false;

        foreach (string subgraphId in subgraphIds)
        {
            List<DiagramNode> members = ast.Nodes
                .Where(node => string.Equals(node.SubgraphId, subgraphId, StringComparison.Ordinal))
                .OrderBy(node => node.OrderKey)
                .ThenBy(node => node.NodeId, StringComparer.Ordinal)
                .ToList();

            if (members.Count < DiagramAstFromGraphCompilerConstants.PeerGridSubgraphMinNodes)
            {
                continue;
            }

            HashSet<string> memberIds = members
                .Select(node => node.NodeId)
                .ToHashSet(StringComparer.Ordinal);

            bool hasIntraSubgraphVisibleEdge = DiagramEdgeVisibility.VisibleEdges(ast.Edges)
                .Any(edge => memberIds.Contains(edge.FromNodeId) && memberIds.Contains(edge.ToNodeId));

            if (hasIntraSubgraphVisibleEdge)
            {
                continue;
            }

            int layoutEdgeCountBefore = ast.Edges.Count;
            AppendGridLinks(ast, members);

            if (ast.Edges.Count > layoutEdgeCountBefore)
            {
                addedSubgraphGridLinks = true;
            }
        }

        if (!addedSubgraphGridLinks && ast.Nodes.Count > 1)
        {
            AppendGridLinks(ast, ast.Nodes);
        }
    }

    private static void AppendGridLinks(DiagramAst ast, IReadOnlyList<DiagramNode> orderedNodes)
    {
        List<DiagramNode> sortedNodes = orderedNodes
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal)
            .ToList();

        foreach (DiagramEdge link in DiagramPeerGridPlanner.BuildGridLinks(sortedNodes))
        {
            ast.Edges.Add(link);
        }
    }

    private static Dictionary<string, List<string>> BuildConnectsToAdjacency(GraphSnapshot graph)
    {
        Dictionary<string, List<string>> adjacency = new(StringComparer.Ordinal);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (edge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
            {
                continue;
            }

            if (!edge.EdgeType.Equals(GraphEdgeTypes.ConnectsTo, StringComparison.Ordinal))
            {
                continue;
            }

            if (!adjacency.TryGetValue(edge.FromNodeId, out List<string>? targets))
            {
                targets = [];
                adjacency[edge.FromNodeId] = targets;
            }

            targets.Add(edge.ToNodeId);
        }

        return adjacency;
    }
}
