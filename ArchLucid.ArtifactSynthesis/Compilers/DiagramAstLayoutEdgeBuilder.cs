using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal static class DiagramAstLayoutEdgeBuilder
{
    public static void EnsureLayoutEdgesWhenEmpty(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        if (ast.Edges.Count > 0 || ast.Nodes.Count <= 1)
        {
            return;
        }

        List<DiagramNode> orderedNodes = ast.Nodes
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal)
            .ToList();

        for (int index = 0; index < orderedNodes.Count - 1; index++)
        {
            ast.Edges.Add(new DiagramEdge
            {
                FromNodeId = orderedNodes[index].NodeId,
                ToNodeId = orderedNodes[index + 1].NodeId,
                Label = string.Empty,
            });
        }
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

            HashSet<string> vnetNodeIds = ResolveVnetNodeIdsForVirtualMachine(node.NodeId, connectsTo, graph);

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

    private static HashSet<string> ResolveVnetNodeIdsForVirtualMachine(
        string vmNodeId,
        IReadOnlyDictionary<string, List<string>> connectsTo,
        GraphSnapshot graph)
    {
        HashSet<string> vnetNodeIds = new(StringComparer.Ordinal);
        Dictionary<string, GraphNode> nodesById = graph.Nodes.ToDictionary(
            candidate => candidate.NodeId,
            StringComparer.Ordinal);

        if (!connectsTo.TryGetValue(vmNodeId, out List<string>? nicIds))
        {
            return vnetNodeIds;
        }

        foreach (string nicNodeId in nicIds)
        {
            if (!connectsTo.TryGetValue(nicNodeId, out List<string>? subnetNodeIds))
            {
                continue;
            }

            foreach (string subnetNodeId in subnetNodeIds)
            {
                if (!nodesById.TryGetValue(subnetNodeId, out GraphNode? subnetNode))
                {
                    continue;
                }

                string subnetArmId = DiagramAstGraphNodeClassifier.ReadArmId(subnetNode);
                string? vnetArmId = TryResolveVnetIdFromSubnetArmId(subnetArmId);

                if (string.IsNullOrWhiteSpace(vnetArmId))
                {
                    continue;
                }

                foreach (GraphNode candidate in graph.Nodes)
                {
                    if (!string.Equals(
                            DiagramAstGraphNodeClassifier.ReadArmId(candidate),
                            vnetArmId,
                            StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    vnetNodeIds.Add(candidate.NodeId);
                }
            }
        }

        return vnetNodeIds;
    }

    private static string? TryResolveVnetIdFromSubnetArmId(string subnetArmId)
    {
        const string marker = "/subnets/";

        int subnetsIndex = subnetArmId.IndexOf(marker, StringComparison.OrdinalIgnoreCase);

        if (subnetsIndex <= 0)
        {
            return null;
        }

        return subnetArmId[..subnetsIndex];
    }
}
