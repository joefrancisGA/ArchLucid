using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Emits visible VNet↔VNet peering edges when the graph stored peering JSON but no <c>PEERS_WITH</c> row.
/// </summary>
internal static class ExecutiveVnetPeeringEdgeBuilder
{
    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyList<GraphNode> topologyNodes,
        IReadOnlyDictionary<string, string> nodeIdMap)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(topologyNodes);
        ArgumentNullException.ThrowIfNull(nodeIdMap);

        Dictionary<string, string> mermaidIdByArmId = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> existingPairKeys = new(StringComparer.Ordinal);

        foreach (GraphNode node in topologyNodes)
        {
            string armId = ArmResourceIdNormalizer.Normalize(DiagramAstGraphNodeClassifier.ReadArmId(node));

            if (string.IsNullOrWhiteSpace(armId) || !nodeIdMap.TryGetValue(node.NodeId, out string? mermaidId))
            {
                continue;
            }

            mermaidIdByArmId[armId] = mermaidId;
        }

        foreach (DiagramEdge edge in DiagramEdgeVisibility.VisibleEdges(ast.Edges))
        {
            existingPairKeys.Add(CanonicalPairKey(edge.FromNodeId, edge.ToNodeId));
        }

        foreach (GraphNode node in graph.Nodes)
        {
            if (!AzureInventoryTopologyCategory.IsVirtualNetworkArmType(
                    DiagramAstGraphNodeClassifier.ReadArmType(node)))
            {
                continue;
            }

            if (!node.Properties.TryGetValue(
                    AzureInventoryVnetPeeringParser.PeeringsPropertyKey,
                    out string? peeringsJson)
                || string.IsNullOrWhiteSpace(peeringsJson))
            {
                continue;
            }

            string fromArmId = ArmResourceIdNormalizer.Normalize(DiagramAstGraphNodeClassifier.ReadArmId(node));

            if (string.IsNullOrWhiteSpace(fromArmId)
                || !mermaidIdByArmId.TryGetValue(fromArmId, out string? fromMermaidId))
            {
                continue;
            }

            foreach (string remoteArmId in AzureInventoryVnetPeeringParser.EnumerateRemoteVnetIds(peeringsJson))
            {
                if (!mermaidIdByArmId.TryGetValue(remoteArmId, out string? toMermaidId))
                {
                    continue;
                }

                string pairKey = CanonicalPairKey(fromMermaidId, toMermaidId);

                if (!existingPairKeys.Add(pairKey))
                {
                    continue;
                }

                ast.Edges.Add(new DiagramEdge
                {
                    FromNodeId = fromMermaidId,
                    ToNodeId = toMermaidId,
                    Label = "peering",
                });
            }
        }
    }

    private static string CanonicalPairKey(string fromNodeId, string toNodeId)
    {
        if (string.CompareOrdinal(fromNodeId, toNodeId) <= 0)
        {
            return $"{fromNodeId}|{toNodeId}";
        }

        return $"{toNodeId}|{fromNodeId}";
    }
}
