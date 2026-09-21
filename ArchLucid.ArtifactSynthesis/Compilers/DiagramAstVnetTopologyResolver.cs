using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal static class DiagramAstVnetTopologyResolver
{
    public static HashSet<string> ResolveSubnetNodeIdsForVirtualMachine(
        string vmNodeId,
        IReadOnlyDictionary<string, List<string>> connectsTo,
        GraphSnapshot graph)
    {
        HashSet<string> subnetNodeIds = new(StringComparer.Ordinal);
        Dictionary<string, GraphNode> nodesById = IndexNodesById(graph);

        if (!connectsTo.TryGetValue(vmNodeId, out List<string>? nicIds))
        {
            return subnetNodeIds;
        }

        foreach (string nicNodeId in nicIds)
        {
            if (!connectsTo.TryGetValue(nicNodeId, out List<string>? nicTargets))
            {
                continue;
            }

            foreach (string subnetNodeId in nicTargets)
            {
                if (!nodesById.TryGetValue(subnetNodeId, out GraphNode? subnetNode))
                {
                    continue;
                }

                if (!IsSubnetNode(subnetNode))
                {
                    continue;
                }

                subnetNodeIds.Add(subnetNodeId);
            }
        }

        return subnetNodeIds;
    }

    public static HashSet<string> ResolveVnetNodeIdsForVirtualMachine(
        string vmNodeId,
        IReadOnlyDictionary<string, List<string>> connectsTo,
        GraphSnapshot graph)
    {
        HashSet<string> vnetNodeIds = new(StringComparer.Ordinal);
        Dictionary<string, GraphNode> nodesById = IndexNodesById(graph);

        foreach (string subnetNodeId in ResolveSubnetNodeIdsForVirtualMachine(vmNodeId, connectsTo, graph))
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

        // NIC hops may already point at the VNet when the subnet was never a graph node.
        if (!connectsTo.TryGetValue(vmNodeId, out List<string>? nicIds))
        {
            return vnetNodeIds;
        }

        foreach (string nicNodeId in nicIds)
        {
            if (!connectsTo.TryGetValue(nicNodeId, out List<string>? nicTargets))
            {
                continue;
            }

            foreach (string targetNodeId in nicTargets)
            {
                if (!nodesById.TryGetValue(targetNodeId, out GraphNode? targetNode))
                {
                    continue;
                }

                if (!AzureInventoryTopologyCategory.IsVirtualNetworkArmType(
                        DiagramAstGraphNodeClassifier.ReadArmType(targetNode)))
                {
                    continue;
                }

                vnetNodeIds.Add(targetNodeId);
            }
        }

        return vnetNodeIds;
    }

    public static bool IsSubnetNode(GraphNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);
        string armId = DiagramAstGraphNodeClassifier.ReadArmId(node);

        if (AzureInventoryTopologyCategory.IsSubnetArmType(armType))
        {
            return true;
        }

        return armId.Contains("/subnets/", StringComparison.OrdinalIgnoreCase);
    }

    private static Dictionary<string, GraphNode> IndexNodesById(GraphSnapshot graph)
    {
        return graph.Nodes
            .GroupBy(candidate => candidate.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
    }

    public static string? TryResolveVnetIdFromSubnetArmId(string subnetArmId)
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
