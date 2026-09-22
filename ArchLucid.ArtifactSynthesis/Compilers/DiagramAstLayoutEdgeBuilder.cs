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

        if (!DiagramNicCollapseApplier.ShouldCollapseNetworkInterfaces(mode))
        {
            return;
        }

        Dictionary<string, List<string>> placementHops = BuildPlacementAdjacency(graph);
        HashSet<string> visibleDiagramIds = ast.Nodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);
        HashSet<string> visibleEdgeKeys = ast.Edges
            .Where(edge => !edge.IsLayoutOnly)
            .Select(edge => $"{edge.FromNodeId}|{edge.ToNodeId}")
            .ToHashSet(StringComparer.Ordinal);

        foreach (GraphNode node in graph.Nodes)
        {
            string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);

            if (!armType.Contains("virtualMachines", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!nodeIdMap.TryGetValue(node.NodeId, out string? vmMermaidId)
                || !visibleDiagramIds.Contains(vmMermaidId))
            {
                continue;
            }

            bool addedSubnetPlacement = false;

            foreach (string subnetNodeId in DiagramAstVnetTopologyResolver.ResolveSubnetNodeIdsForVirtualMachine(
                         node.NodeId,
                         placementHops,
                         graph))
            {
                if (!nodeIdMap.TryGetValue(subnetNodeId, out string? subnetMermaidId)
                    || !visibleDiagramIds.Contains(subnetMermaidId))
                {
                    continue;
                }

                if (visibleEdgeKeys.Contains($"{vmMermaidId}|{subnetMermaidId}"))
                {
                    addedSubnetPlacement = true;
                    continue;
                }

                if (!TryAddDerivedPlacementEdge(ast, visibleEdgeKeys, vmMermaidId, subnetMermaidId))
                {
                    continue;
                }

                addedSubnetPlacement = true;
            }

            if (addedSubnetPlacement)
            {
                continue;
            }

            foreach (string vnetNodeId in DiagramAstVnetTopologyResolver.ResolveVnetNodeIdsForVirtualMachine(
                         node.NodeId,
                         placementHops,
                         graph))
            {
                if (!nodeIdMap.TryGetValue(vnetNodeId, out string? vnetMermaidId)
                    || !visibleDiagramIds.Contains(vnetMermaidId))
                {
                    continue;
                }

                TryAddDerivedPlacementEdge(ast, visibleEdgeKeys, vmMermaidId, vnetMermaidId);
            }
        }
    }

    private static bool TryAddDerivedPlacementEdge(
        DiagramAst ast,
        HashSet<string> visibleEdgeKeys,
        string fromDiagramId,
        string toDiagramId)
    {
        string edgeKey = $"{fromDiagramId}|{toDiagramId}";

        if (!visibleEdgeKeys.Add(edgeKey))
        {
            return false;
        }

        ast.Edges.Add(new DiagramEdge
        {
            FromNodeId = fromDiagramId,
            ToNodeId = toDiagramId,
            Label = "in",
            InferenceSource = GraphEdgeInferenceSources.InventoryLayoutVmVnet,
        });

        return true;
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

    private static Dictionary<string, List<string>> BuildPlacementAdjacency(GraphSnapshot graph)
    {
        Dictionary<string, List<string>> adjacency = new(StringComparer.Ordinal);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (edge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
            {
                continue;
            }

            if (!IsPlacementHopEdge(edge))
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

    private static bool IsPlacementHopEdge(GraphEdge edge)
    {
        if (edge.EdgeType.Equals(GraphEdgeTypes.ConnectsTo, StringComparison.Ordinal))
        {
            return true;
        }

        return DiagramNicOwnerResolver.IsVmToNicEdge(edge)
            || DiagramNicOwnerResolver.IsNicToSubnetEdge(edge);
    }
}
