using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Emits visible VNet↔VNet peering edges when the graph stored peering JSON but no <c>PEERS_WITH</c> row,
///     and keeps already-drawn VNet pairs labeled as peering when the stored edge type was blank.
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

            foreach (string remoteArmId in AzureInventoryVnetPeeringParser.EnumerateConnectedRemoteVnetArmIds(peeringsJson))
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

                ast.Edges.Add(CreateObservedPeeringEdge(fromMermaidId, toMermaidId));
            }
        }

        EnsureObservedPeeringOnVirtualNetworkPairs(ast);
    }

    private static void EnsureObservedPeeringOnVirtualNetworkPairs(DiagramAst ast)
    {
        Dictionary<string, DiagramNode> nodesById = ast.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (DiagramEdge edge in DiagramEdgeVisibility.VisibleEdges(ast.Edges))
        {
            if (!IsVirtualNetworkNode(nodesById, edge.FromNodeId)
                || !IsVirtualNetworkNode(nodesById, edge.ToNodeId))
            {
                continue;
            }

            if (!ShouldAnnotateAsObservedPeering(edge))
            {
                continue;
            }

            AssignObservedPeeringProvenance(edge);
        }
    }

    private static bool ShouldAnnotateAsObservedPeering(DiagramEdge edge)
    {
        if (!string.IsNullOrWhiteSpace(edge.ProvenanceKind))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(edge.Label)
            || string.Equals(
                edge.Label,
                DiagramConnectionTypeAnnotator.RelationshipNotStoredLabel,
                StringComparison.Ordinal)
            || string.Equals(edge.Label, "peering", StringComparison.OrdinalIgnoreCase)
            || string.Equals(
                edge.Label,
                InventoryDiagramRelationshipLabelTexts.PeeringRemoteNetworkIdStoredPeeringStateNotStored,
                StringComparison.OrdinalIgnoreCase)
            || string.Equals(
                edge.Label,
                InventoryDiagramRelationshipLabelTexts.Peered,
                StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }

    // ObservedFact keeps DiagramEdgeProvenanceDisplayLabelApplier from replacing the verb
    // with "Provenance was not stored." when the graph omitted a provenance kind.
    private static DiagramEdge CreateObservedPeeringEdge(string fromNodeId, string toNodeId)
    {
        DiagramEdge edge = new()
        {
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
        };
        AssignObservedPeeringProvenance(edge);
        return edge;
    }

    private static void AssignObservedPeeringProvenance(DiagramEdge edge)
    {
        edge.Label = InventoryDiagramRelationshipLabelTexts.PeeringRemoteNetworkIdStoredPeeringStateNotStored;
        edge.InferenceSource = GraphEdgeInferenceSources.InventoryVnetPeering;
        edge.ProvenanceKind = ProvenanceKind.ObservedFact.ToString();
    }

    private static bool IsVirtualNetworkNode(
        IReadOnlyDictionary<string, DiagramNode> nodesById,
        string nodeId)
    {
        if (!nodesById.TryGetValue(nodeId, out DiagramNode? node))
        {
            return false;
        }

        return AzureInventoryTopologyCategory.IsVirtualNetworkArmType(node.ArmResourceType ?? string.Empty);
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
