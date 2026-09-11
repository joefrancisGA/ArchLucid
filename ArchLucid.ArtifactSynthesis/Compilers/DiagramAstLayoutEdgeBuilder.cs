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

            HashSet<string> vnetIds = ResolveVnetIdsForVirtualMachine(node.NodeId, connectsTo);

            foreach (string vnetId in vnetIds)
            {
                if (!nodeIdMap.TryGetValue(vnetId, out string? vnetMermaidId))
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

    private static HashSet<string> ResolveVnetIdsForVirtualMachine(
        string vmNodeId,
        IReadOnlyDictionary<string, List<string>> connectsTo)
    {
        HashSet<string> vnetIds = new(StringComparer.Ordinal);

        if (!connectsTo.TryGetValue(vmNodeId, out List<string>? nicIds))
        {
            return vnetIds;
        }

        foreach (string nicId in nicIds)
        {
            if (!connectsTo.TryGetValue(nicId, out List<string>? subnetIds))
            {
                continue;
            }

            foreach (string subnetId in subnetIds)
            {
                string? vnetId = TryResolveVnetIdFromSubnetArmId(subnetId);

                if (!string.IsNullOrWhiteSpace(vnetId))
                {
                    vnetIds.Add(vnetId);
                }
            }
        }

        return vnetIds;
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
