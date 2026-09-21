using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Keeps VNets that participate in peerings on Executive/Network diagrams even when a mode filter
///     would otherwise drop them.
/// </summary>
internal static class ExecutiveVnetPeeringEndpointIncluder
{
    public static List<GraphNode> Include(GraphSnapshot graph, List<GraphNode> nodes, DiagramMode mode)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(nodes);

        if (mode is not DiagramMode.Executive and not DiagramMode.Network)
        {
            return nodes;
        }

        Dictionary<string, GraphNode> includedById = nodes.ToDictionary(
            node => node.NodeId,
            StringComparer.Ordinal);
        Dictionary<string, GraphNode> graphNodesById = graph.Nodes.ToDictionary(
            node => node.NodeId,
            StringComparer.Ordinal);
        Dictionary<string, GraphNode> graphNodesByArmId = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in graph.Nodes)
        {
            string armId = ArmResourceIdNormalizer.Normalize(DiagramAstGraphNodeClassifier.ReadArmId(node));

            if (!string.IsNullOrWhiteSpace(armId) && !graphNodesByArmId.ContainsKey(armId))
            {
                graphNodesByArmId[armId] = node;
            }
        }

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!IsPeeringEdge(edge))
            {
                continue;
            }

            EnsureNode(edge.FromNodeId, includedById, graphNodesById, nodes);
            EnsureNode(edge.ToNodeId, includedById, graphNodesById, nodes);
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

            EnsureNode(node.NodeId, includedById, graphNodesById, nodes);

            foreach (string remoteArmId in AzureInventoryVnetPeeringParser.EnumerateRemoteVnetIds(peeringsJson))
            {
                EnsureRemoteNode(remoteArmId, includedById, graphNodesByArmId, nodes);
            }
        }

        // Preserve mode-filter ordering (Executive summary VNets then always-show tiers); peering endpoints append at the tail.
        return nodes;
    }

    private static bool IsPeeringEdge(GraphEdge edge)
    {
        return AzureInventoryRelationshipAssociationTypes.IsVnetPeeringRelationship(
            edge.EdgeType,
            edge.InferenceSource);
    }

    private static void EnsureNode(
        string nodeId,
        Dictionary<string, GraphNode> includedById,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        List<GraphNode> nodes)
    {
        if (includedById.ContainsKey(nodeId))
        {
            return;
        }

        if (!graphNodesById.TryGetValue(nodeId, out GraphNode? existing))
        {
            return;
        }

        nodes.Add(existing);
        includedById[nodeId] = existing;
    }

    private static void EnsureRemoteNode(
        string remoteArmId,
        Dictionary<string, GraphNode> includedById,
        IReadOnlyDictionary<string, GraphNode> graphNodesByArmId,
        List<GraphNode> nodes)
    {
        string normalized = ArmResourceIdNormalizer.Normalize(remoteArmId);

        if (string.IsNullOrWhiteSpace(normalized))
        {
            return;
        }

        if (graphNodesByArmId.TryGetValue(normalized, out GraphNode? existing))
        {
            if (includedById.ContainsKey(existing.NodeId))
            {
                return;
            }

            nodes.Add(existing);
            includedById[existing.NodeId] = existing;

            return;
        }

        GraphNode stub = ExecutiveVnetPeeringStubNodeFactory.Create(normalized);

        if (includedById.ContainsKey(stub.NodeId))
        {
            return;
        }

        nodes.Add(stub);
        includedById[stub.NodeId] = stub;
    }
}
