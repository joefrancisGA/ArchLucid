using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal static class ExecutiveVnetSummaryBuilder
{
    public static void ApplyExecutiveVnetLabels(DiagramAst ast, GraphSnapshot graph, IReadOnlyList<GraphNode> topologyNodes)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(topologyNodes);

        Dictionary<string, GraphNode> nodesById = topologyNodes.ToDictionary(
            node => node.NodeId,
            StringComparer.Ordinal);
        Dictionary<string, string> armIdToNodeId = topologyNodes
            .GroupBy(node => DiagramAstGraphNodeClassifier.ReadArmId(node), StringComparer.OrdinalIgnoreCase)
            .Where(group => !string.IsNullOrWhiteSpace(group.Key))
            .ToDictionary(group => group.Key, group => group.First().NodeId, StringComparer.OrdinalIgnoreCase);

        Dictionary<string, List<string>> connectsTo = BuildConnectsToAdjacency(graph);
        Dictionary<string, VnetResourceCounts> countsByVnetNodeId = BuildVnetCounts(graph, topologyNodes, armIdToNodeId);

        foreach (DiagramNode diagramNode in ast.Nodes)
        {
            GraphNode? sourceNode = topologyNodes.FirstOrDefault(
                candidate => string.Equals(candidate.NodeId, diagramNode.SeedNodeId, StringComparison.Ordinal));

            if (sourceNode is null)
            {
                continue;
            }

            string armType = DiagramAstGraphNodeClassifier.ReadArmType(sourceNode);

            if (!AzureInventoryTopologyCategory.IsVirtualNetworkArmType(armType))
            {
                continue;
            }

            if (!countsByVnetNodeId.TryGetValue(sourceNode.NodeId, out VnetResourceCounts counts))
            {
                counts = new VnetResourceCounts(0, 0);
            }

            diagramNode.Label = BuildVnetLabel(diagramNode.Label, counts);
        }

        NormalizePeeringEdgeLabels(ast);
    }

    private static void NormalizePeeringEdgeLabels(DiagramAst ast)
    {
        foreach (DiagramEdge edge in ast.Edges)
        {
            if (edge.IsLayoutOnly)
            {
                continue;
            }

            if (string.Equals(edge.Label, GraphEdgeTypes.PeersWith, StringComparison.Ordinal))
            {
                edge.Label = "peered";
            }
        }
    }

    private static string BuildVnetLabel(string baseLabel, VnetResourceCounts counts)
    {
        List<string> suffixParts = [];

        if (counts.SubnetCount > 0)
        {
            suffixParts.Add($"{counts.SubnetCount} subnet{(counts.SubnetCount == 1 ? string.Empty : "s")}");
        }

        if (counts.VirtualMachineCount > 0)
        {
            suffixParts.Add($"{counts.VirtualMachineCount} VM{(counts.VirtualMachineCount == 1 ? string.Empty : "s")}");
        }

        if (suffixParts.Count == 0)
        {
            return baseLabel;
        }

        string suffix = string.Join(" · ", suffixParts);

        return $"{MermaidDiagramRenderer.EscapeLabel(baseLabel)} · {suffix}";
    }

    private static Dictionary<string, VnetResourceCounts> BuildVnetCounts(
        GraphSnapshot graph,
        IReadOnlyList<GraphNode> topologyNodes,
        IReadOnlyDictionary<string, string> armIdToNodeId)
    {
        Dictionary<string, VnetResourceCounts> counts = new(StringComparer.Ordinal);
        HashSet<string> vnetNodeIds = topologyNodes
            .Where(node => AzureInventoryTopologyCategory.IsVirtualNetworkArmType(
                DiagramAstGraphNodeClassifier.ReadArmType(node)))
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        foreach (string vnetNodeId in vnetNodeIds)
        {
            counts[vnetNodeId] = new VnetResourceCounts(0, 0);
        }

        foreach (GraphNode node in graph.Nodes)
        {
            string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);
            string? parentArmId = node.Properties.TryGetValue("arm.parentId", out string? parentId) ? parentId : null;

            if (!string.IsNullOrWhiteSpace(parentArmId)
                && armIdToNodeId.TryGetValue(parentArmId, out string? parentNodeId)
                && counts.ContainsKey(parentNodeId)
                && AzureInventoryTopologyCategory.IsSubnetArmType(armType))
            {
                VnetResourceCounts current = counts[parentNodeId];
                counts[parentNodeId] = current with { SubnetCount = current.SubnetCount + 1 };
            }
        }

        Dictionary<string, List<string>> connectsTo = BuildConnectsToAdjacency(graph);

        foreach (GraphNode node in graph.Nodes)
        {
            string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);

            if (!armType.Contains("virtualMachines", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            HashSet<string> vnetIds = DiagramAstVnetTopologyResolver.ResolveVnetNodeIdsForVirtualMachine(
                node.NodeId,
                connectsTo,
                graph);

            foreach (string vnetNodeId in vnetIds)
            {
                if (!counts.ContainsKey(vnetNodeId))
                {
                    continue;
                }

                VnetResourceCounts current = counts[vnetNodeId];
                counts[vnetNodeId] = current with { VirtualMachineCount = current.VirtualMachineCount + 1 };
            }
        }

        return counts;
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

    private readonly record struct VnetResourceCounts(int SubnetCount, int VirtualMachineCount);
}
