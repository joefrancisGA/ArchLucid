using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal static class DiagramAstVnetTopologyResolver
{
    public static HashSet<string> ResolveVnetNodeIdsForVirtualMachine(
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
