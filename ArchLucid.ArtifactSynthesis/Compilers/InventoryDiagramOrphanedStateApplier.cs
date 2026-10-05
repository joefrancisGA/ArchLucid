using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Applies NR-05 orphaned and unconnected posture to standalone diagram nodes.</summary>
internal static class InventoryDiagramOrphanedStateApplier
{
    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        GraphSnapshot? analysisGraph = null)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        if (ast.Nodes.Count == 0)
        {
            return;
        }

        GraphSnapshot classificationGraph = analysisGraph ?? graph;
        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        HashSet<string> citedEdgeNodeIds = ast.Edges
            .Where(edge => !edge.IsLayoutOnly
                && !string.Equals(
                    edge.InferenceSource,
                    GraphEdgeInferenceSources.InventoryResourceGroupCollocation,
                    StringComparison.OrdinalIgnoreCase))
            .SelectMany(edge => new[] { edge.FromNodeId, edge.ToNodeId })
            .ToHashSet(StringComparer.Ordinal);

        foreach (DiagramNode diagramNode in ast.Nodes)
        {
            if (string.IsNullOrWhiteSpace(diagramNode.SeedNodeId)
                || !graphNodesById.TryGetValue(diagramNode.SeedNodeId, out GraphNode? graphNode))
            {
                continue;
            }

            bool hasCitedDiagramEdges = citedEdgeNodeIds.Contains(diagramNode.NodeId);

            InventoryDiagramConnectionStateResult result = InventoryDiagramOrphanedStateClassifier.Classify(
                graphNode,
                classificationGraph,
                hasCitedDiagramEdges);

            if (hasCitedDiagramEdges)
            {
                diagramNode.ConnectionState = InventoryDiagramConnectionState.Connected;
                diagramNode.ConnectionStateMessage = null;
                diagramNode.UnresolvedRelationshipDetails = result.UnresolvedRelationshipDetails.ToList();
                continue;
            }

            if (result.State is not null)
            {
                diagramNode.ConnectionState = result.State;
                diagramNode.ConnectionStateMessage = result.MissingRequirementMessage;
                diagramNode.UnresolvedRelationshipDetails = result.UnresolvedRelationshipDetails.ToList();
                continue;
            }

            if (TryResolvePublicIpUsedMessage(
                    graphNode,
                    classificationGraph,
                    out string? publicIpUsedMessage))
            {
                diagramNode.ConnectionState = InventoryDiagramConnectionState.Used;
                diagramNode.ConnectionStateMessage = publicIpUsedMessage;
                diagramNode.UnresolvedRelationshipDetails = result.UnresolvedRelationshipDetails.ToList();
                continue;
            }

            if (TryResolveUsedMessage(graph, graphNode.NodeId, out string? usedMessage))
            {
                diagramNode.ConnectionState = InventoryDiagramConnectionState.Used;
                diagramNode.ConnectionStateMessage = usedMessage;
                diagramNode.UnresolvedRelationshipDetails = result.UnresolvedRelationshipDetails.ToList();
                continue;
            }

            diagramNode.ConnectionState = InventoryDiagramConnectionState.Unknown;
            diagramNode.ConnectionStateMessage = null;
            diagramNode.UnresolvedRelationshipDetails = result.UnresolvedRelationshipDetails.ToList();
        }
    }

    private static bool TryResolveUsedMessage(
        GraphSnapshot graph,
        string graphNodeId,
        out string? message)
    {
        foreach (GraphEdge edge in graph.Edges)
        {
            if (!string.Equals(edge.FromNodeId, graphNodeId, StringComparison.Ordinal)
                && !string.Equals(edge.ToNodeId, graphNodeId, StringComparison.Ordinal))
            {
                continue;
            }

            if (string.Equals(
                    edge.InferenceSource,
                    GraphEdgeInferenceSources.InventoryHiddenSubnetVnetPlacement,
                    StringComparison.OrdinalIgnoreCase))
            {
                message = "hidden subnet placement";
                return true;
            }

            if (string.Equals(
                    edge.InferenceSource,
                    GraphEdgeInferenceSources.InventoryEffectiveNsg,
                    StringComparison.OrdinalIgnoreCase)
                || string.Equals(
                    edge.InferenceSource,
                    GraphEdgeInferenceSources.InventoryEffectiveRoutes,
                    StringComparison.OrdinalIgnoreCase))
            {
                message = "effective network control";
                return true;
            }
        }

        message = null;
        return false;
    }

    private static bool TryResolvePublicIpUsedMessage(
        GraphNode graphNode,
        GraphSnapshot classificationGraph,
        out string? message)
    {
        message = null;

        if (!string.Equals(
                ReadArmType(graphNode),
                "Microsoft.Network/publicIPAddresses",
                StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        Dictionary<string, GraphNode> armIdToGraphNode = classificationGraph.Nodes
            .Where(node => node.Properties.TryGetValue("arm.id", out string? armId)
                && !string.IsNullOrWhiteSpace(armId))
            .ToDictionary(
                node => ArmResourceIdNormalizer.Normalize(node.Properties["arm.id"]),
                node => node,
                StringComparer.OrdinalIgnoreCase);
        IReadOnlyList<string> parentArmIds =
            ResolvePublicIpParentArmIds(graphNode, classificationGraph);

        foreach (string parentArmId in parentArmIds)
        {
            string? resolvedArmId = ResolveArmIdIncludingAncestor(parentArmId, armIdToGraphNode);

            if (!string.IsNullOrWhiteSpace(resolvedArmId))
            {
                message = $"attached to {ReadResourceName(resolvedArmId)}";
                return true;
            }
        }

        return false;
    }

    private static IReadOnlyList<string> ResolvePublicIpParentArmIds(
        GraphNode graphNode,
        GraphSnapshot graph)
    {
        Dictionary<string, HashSet<string>> publicIpReferencingParents =
            AzureInventoryParentAttachmentParentResolver.BuildPublicIpReferencingParentArmIdMap(graph.Nodes);
        AzureInventoryParentAttachmentResolveResult resolved =
            AzureInventoryParentAttachmentParentResolver.Resolve(
                graphNode,
                graph,
                publicIpReferencingParents);

        if (resolved.ParentArmIds.Count > 0)
        {
            return resolved.ParentArmIds;
        }

        if (graphNode.Properties.TryGetValue("ipConfiguration.id", out string? ipConfigurationId))
        {
            string? parentArmId =
                AzureInventoryPublicIpConfigurationParentResolver.TryResolveParentArmId(ipConfigurationId);

            if (!string.IsNullOrWhiteSpace(parentArmId))
            {
                return [parentArmId];
            }
        }

        if (graphNode.Properties.TryGetValue("natGateway.id", out string? natGatewayId)
            && !string.IsNullOrWhiteSpace(natGatewayId))
        {
            return [ArmResourceIdNormalizer.Normalize(natGatewayId)];
        }

        return [];
    }

    private static string? ResolveArmIdIncludingAncestor(
        string armId,
        IReadOnlyDictionary<string, GraphNode> armIdToGraphNode)
    {
        string normalizedArmId = ArmResourceIdNormalizer.Normalize(armId);

        if (armIdToGraphNode.ContainsKey(normalizedArmId))
        {
            return normalizedArmId;
        }

        foreach (string ancestor in ArmResourceIdNormalizer.EnumerateAncestorResourceIds(normalizedArmId))
        {
            if (armIdToGraphNode.ContainsKey(ancestor))
            {
                return ancestor;
            }
        }

        return null;
    }

    private static string ReadArmType(GraphNode node)
    {
        return node.Properties.TryGetValue("arm.type", out string? armType)
            ? armType
            : string.Empty;
    }

    private static string ReadResourceName(string armResourceId)
    {
        int lastSlash = armResourceId.LastIndexOf('/');

        return lastSlash >= 0 && lastSlash < armResourceId.Length - 1
            ? armResourceId[(lastSlash + 1)..]
            : "parent resource";
    }
}
