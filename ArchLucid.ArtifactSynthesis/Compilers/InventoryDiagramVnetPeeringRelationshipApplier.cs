using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Draws one Peered line for connected VNet peerings (NR-26).</summary>
internal static class InventoryDiagramVnetPeeringRelationshipApplier
{
    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        DiagramMode mode)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        if (mode == DiagramMode.Executive || ast.Nodes.Count == 0)
        {
            return;
        }

        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
        Dictionary<string, string> armIdToDiagramNodeId = BuildArmIdToDiagramNodeId(ast, graphToDiagramNodeId, graphNodesById);
        HashSet<string> connectedPairs = new(StringComparer.Ordinal);

        foreach (GraphNode vnetNode in graph.Nodes)
        {
            if (!AzureInventoryVnetPeeringParser.IsVirtualNetworkResourceType(DiagramAstGraphNodeClassifier.ReadArmType(vnetNode)))
            {
                continue;
            }

            if (!graphToDiagramNodeId.TryGetValue(vnetNode.NodeId, out string? localDiagramNodeId))
            {
                continue;
            }

            if (!AzureInventoryVnetPeeringParser.TryGetPeeringsJson(vnetNode.Properties, out string? peeringsJson))
            {
                continue;
            }

            DiagramNode? localDiagramNode = ast.Nodes.FirstOrDefault(node =>
                string.Equals(node.NodeId, localDiagramNodeId, StringComparison.Ordinal));

            if (localDiagramNode is null)
            {
                continue;
            }

            foreach (AzureInventoryVnetPeeringRecord peering in AzureInventoryVnetPeeringParser.ParsePeerings(peeringsJson))
            {
                if (string.IsNullOrWhiteSpace(peering.RemoteVirtualNetworkArmId))
                {
                    AddUnresolvedDetail(localDiagramNode, "Remote network id was not stored.");
                    continue;
                }

                GraphNode? remoteVnetNode = graphNodesById.Values.FirstOrDefault(node =>
                    string.Equals(
                        ArmResourceIdNormalizer.Normalize(DiagramAstGraphNodeClassifier.ReadArmId(node)),
                        ArmResourceIdNormalizer.Normalize(peering.RemoteVirtualNetworkArmId),
                        StringComparison.OrdinalIgnoreCase));
                string remoteName = InventoryDiagramArmSegmentResourceNames.ResolveRelationshipName(
                    peering.RemoteVirtualNetworkArmId,
                    remoteVnetNode?.Label,
                    remoteVnetNode?.NodeId,
                    InventoryDiagramArmSegmentResourceNames.RemoteNetworkNameNotStored);

                if (!AzureInventoryVnetPeeringParser.IsConnectedPeeringState(peering.PeeringState))
                {
                    string outlineSentence = string.IsNullOrWhiteSpace(peering.PeeringState)
                        ? InventoryDiagramRelationshipLabelTexts.FormatPeeringStateNotStored(remoteName)
                        : InventoryDiagramRelationshipLabelTexts.FormatPeeringNotConnected(remoteName);
                    AddUnresolvedDetail(localDiagramNode, outlineSentence);
                    continue;
                }

                if (!armIdToDiagramNodeId.TryGetValue(
                        ArmResourceIdNormalizer.Normalize(peering.RemoteVirtualNetworkArmId),
                        out string? remoteDiagramNodeId))
                {
                    AddUnresolvedDetail(
                        localDiagramNode,
                        InventoryDiagramRelationshipLabelTexts.FormatPeeringConnectedOffCanvas(remoteName));
                    continue;
                }

                string pairKey = BuildUndirectedPairKey(localDiagramNodeId, remoteDiagramNodeId);

                if (!connectedPairs.Add(pairKey))
                {
                    continue;
                }

                RemoveInventoryPeeringEdges(ast, localDiagramNodeId, remoteDiagramNodeId);
                InventoryDiagramRelationshipEdgeHelper.ReplaceOrAddDirectedEdge(
                    ast,
                    localDiagramNodeId,
                    remoteDiagramNodeId,
                    InventoryDiagramRelationshipLabelTexts.Peered,
                    GraphEdgeInferenceSources.InventoryVnetPeering,
                    ProvenanceKind.ObservedFact.ToString());
            }
        }
    }

    private static void RemoveInventoryPeeringEdges(DiagramAst ast, string leftDiagramNodeId, string rightDiagramNodeId)
    {
        ast.Edges.RemoveAll(edge =>
            !edge.IsLayoutOnly
            && string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryVnetPeering, StringComparison.OrdinalIgnoreCase)
            && ((string.Equals(edge.FromNodeId, leftDiagramNodeId, StringComparison.Ordinal)
                    && string.Equals(edge.ToNodeId, rightDiagramNodeId, StringComparison.Ordinal))
                || (string.Equals(edge.FromNodeId, rightDiagramNodeId, StringComparison.Ordinal)
                    && string.Equals(edge.ToNodeId, leftDiagramNodeId, StringComparison.Ordinal))));
    }

    private static Dictionary<string, string> BuildArmIdToDiagramNodeId(
        DiagramAst ast,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById)
    {
        Dictionary<string, string> armIdToDiagramNodeId = new(StringComparer.OrdinalIgnoreCase);

        foreach (DiagramNode diagramNode in ast.Nodes)
        {
            if (string.IsNullOrWhiteSpace(diagramNode.ArmResourceId))
            {
                continue;
            }

            armIdToDiagramNodeId[ArmResourceIdNormalizer.Normalize(diagramNode.ArmResourceId)] = diagramNode.NodeId;
        }

        foreach ((string graphNodeId, string diagramNodeId) in graphToDiagramNodeId)
        {
            if (!graphNodesById.TryGetValue(graphNodeId, out GraphNode? graphNode))
            {
                continue;
            }

            string armId = DiagramAstGraphNodeClassifier.ReadArmId(graphNode);

            if (!string.IsNullOrWhiteSpace(armId))
            {
                armIdToDiagramNodeId[ArmResourceIdNormalizer.Normalize(armId)] = diagramNodeId;
            }
        }

        return armIdToDiagramNodeId;
    }

    private static void AddUnresolvedDetail(DiagramNode diagramNode, string outlineSentence)
    {
        if (!diagramNode.UnresolvedRelationshipDetails.Contains(outlineSentence, StringComparer.Ordinal))
        {
            diagramNode.UnresolvedRelationshipDetails.Add(outlineSentence);
        }
    }

    private static string BuildUndirectedPairKey(string leftId, string rightId)
    {
        if (string.CompareOrdinal(leftId, rightId) <= 0)
        {
            return leftId + "|" + rightId;
        }

        return rightId + "|" + leftId;
    }

    private static string ReadResourceName(string armId)
    {
        int lastSlash = armId.LastIndexOf('/');

        if (lastSlash < 0 || lastSlash >= armId.Length - 1)
        {
            return "Remote network name was not stored.";
        }

        string remoteName = armId[(lastSlash + 1)..].Trim();

        if (remoteName.Length == 0
            || string.Equals(remoteName, "virtualNetworks", StringComparison.OrdinalIgnoreCase))
        {
            return "Remote network name was not stored.";
        }

        return remoteName;
    }
}
