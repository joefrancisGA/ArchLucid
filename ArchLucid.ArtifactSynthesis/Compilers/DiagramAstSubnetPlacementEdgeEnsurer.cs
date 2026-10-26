using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     When subnet cards stay visible, keep cited VM→subnet placement edges after hop compose (IDX-05).
/// </summary>
internal static class DiagramAstSubnetPlacementEdgeEnsurer
{
    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        HashSet<string> visibleSubnetDiagramIds = ast.Nodes
            .Where(node => IsSubnetArmType(node.ArmResourceType))
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        if (visibleSubnetDiagramIds.Count == 0)
        {
            return;
        }

        HashSet<string> visibleDiagramIds = ast.Nodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);
        HashSet<string> visibleEdgeKeys = ast.Edges
            .Where(edge => !edge.IsLayoutOnly)
            .Select(edge => $"{edge.FromNodeId}|{edge.ToNodeId}")
            .ToHashSet(StringComparer.Ordinal);
        Dictionary<string, List<string>> placementHops = BuildPlacementAdjacency(graph);

        foreach (GraphNode graphNode in graph.Nodes)
        {
            string armType = DiagramAstGraphNodeClassifier.ReadArmType(graphNode);

            if (!armType.Contains("virtualMachines", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!graphToDiagramNodeId.TryGetValue(graphNode.NodeId, out string? vmDiagramId)
                || !visibleDiagramIds.Contains(vmDiagramId))
            {
                continue;
            }

            foreach (string subnetGraphNodeId in DiagramAstVnetTopologyResolver.ResolveSubnetNodeIdsForVirtualMachine(
                         graphNode.NodeId,
                         placementHops,
                         graph))
            {
                if (!graphToDiagramNodeId.TryGetValue(subnetGraphNodeId, out string? subnetDiagramId)
                    || !visibleSubnetDiagramIds.Contains(subnetDiagramId))
                {
                    continue;
                }

                string edgeKey = $"{vmDiagramId}|{subnetDiagramId}";

                if (!visibleEdgeKeys.Add(edgeKey))
                {
                    continue;
                }

                ast.Edges.Add(new DiagramEdge
                {
                    FromNodeId = vmDiagramId,
                    ToNodeId = subnetDiagramId,
                    Label = InventoryDiagramRelationshipLabelTexts.SubnetPlacementStoredReachabilityNotObserved,
                    InferenceSource = GraphEdgeInferenceSources.InventoryLayoutVmVnet,
                });
            }
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

            if (!adjacency.TryGetValue(edge.FromNodeId, out List<string>? targets))
            {
                targets = [];
                adjacency[edge.FromNodeId] = targets;
            }

            targets.Add(edge.ToNodeId);
        }

        return adjacency;
    }

    private static bool IsSubnetArmType(string? armType)
    {
        return (armType ?? string.Empty).Contains(
            "Microsoft.Network/virtualNetworks/subnets",
            StringComparison.OrdinalIgnoreCase);
    }
}
