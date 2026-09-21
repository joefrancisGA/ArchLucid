using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Marks PaaS targets reached through a private endpoint, even when the PE node is off-canvas,
///     and names the PE cards that the lock replaces.
/// </summary>
internal static class DiagramPrivateEndpointTargetAnnotator
{
    public static HashSet<string> Apply(
        DiagramAst ast,
        IReadOnlyList<GraphNode> graphNodes,
        IReadOnlyList<GraphEdge> graphEdges,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graphNodes);
        ArgumentNullException.ThrowIfNull(graphEdges);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        HashSet<string> privateEndpointDiagramNodeIdsToHide = new(StringComparer.Ordinal);

        if (ast.Nodes.Count == 0 || graphEdges.Count == 0)
        {
            return privateEndpointDiagramNodeIdsToHide;
        }

        Dictionary<string, GraphNode> graphNodesById = graphNodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
        Dictionary<string, DiagramNode> diagramNodesById = ast.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
        Dictionary<string, DiagramNode> diagramNodesBySeedId = ast.Nodes
            .Where(node => !string.IsNullOrWhiteSpace(node.SeedNodeId))
            .GroupBy(node => node.SeedNodeId!, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (GraphEdge graphEdge in graphEdges)
        {
            if (!graphNodesById.TryGetValue(graphEdge.FromNodeId, out GraphNode? fromGraphNode))
            {
                continue;
            }

            if (!graphNodesById.TryGetValue(graphEdge.ToNodeId, out GraphNode? toGraphNode))
            {
                continue;
            }

            if (!IsPrivateEndpointDataPlaneTargetEdge(graphEdge, fromGraphNode, toGraphNode))
            {
                continue;
            }

            List<DiagramNode> targetNodes = ResolveTargetDiagramNodes(
                toGraphNode,
                graphToDiagramNodeId,
                diagramNodesById,
                diagramNodesBySeedId,
                graphNodes);

            if (targetNodes.Count == 0)
            {
                continue;
            }

            foreach (DiagramNode targetNode in targetNodes)
            {
                targetNode.HasPrivateEndpointAccess = true;
            }

            string? fromDiagramId = null;

            if (graphToDiagramNodeId.TryGetValue(graphEdge.FromNodeId, out string? mappedFromDiagramId)
                && diagramNodesById.ContainsKey(mappedFromDiagramId))
            {
                fromDiagramId = mappedFromDiagramId;
                privateEndpointDiagramNodeIdsToHide.Add(mappedFromDiagramId);
            }

            ClearPrivateEndpointEdgeLabels(ast, fromDiagramId, targetNodes);
        }

        return privateEndpointDiagramNodeIdsToHide;
    }

    private static List<DiagramNode> ResolveTargetDiagramNodes(
        GraphNode toGraphNode,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        Dictionary<string, DiagramNode> diagramNodesById,
        Dictionary<string, DiagramNode> diagramNodesBySeedId,
        IReadOnlyList<GraphNode> graphNodes)
    {
        List<DiagramNode> targets = [];
        HashSet<string> seenDiagramIds = new(StringComparer.Ordinal);

        if (graphToDiagramNodeId.TryGetValue(toGraphNode.NodeId, out string? toDiagramId)
            && diagramNodesById.TryGetValue(toDiagramId, out DiagramNode? exactNode)
            && seenDiagramIds.Add(exactNode.NodeId))
        {
            targets.Add(exactNode);
        }

        string targetArmId = DiagramAstGraphNodeClassifier.ReadArmId(toGraphNode);

        if (string.IsNullOrWhiteSpace(targetArmId))
        {
            return targets;
        }

        string targetPrefix = targetArmId.TrimEnd('/') + "/";

        foreach (GraphNode graphNode in graphNodes)
        {
            if (!diagramNodesBySeedId.TryGetValue(graphNode.NodeId, out DiagramNode? diagramNode))
            {
                continue;
            }

            string candidateArmId = DiagramAstGraphNodeClassifier.ReadArmId(graphNode);

            if (string.IsNullOrWhiteSpace(candidateArmId))
            {
                continue;
            }

            bool isExact = candidateArmId.Equals(targetArmId, StringComparison.OrdinalIgnoreCase);
            bool isChild = candidateArmId.StartsWith(targetPrefix, StringComparison.OrdinalIgnoreCase);

            if (!isExact && !isChild)
            {
                continue;
            }

            if (seenDiagramIds.Add(diagramNode.NodeId))
            {
                targets.Add(diagramNode);
            }
        }

        return targets;
    }

    private static void ClearPrivateEndpointEdgeLabels(
        DiagramAst ast,
        string? fromDiagramId,
        IReadOnlyList<DiagramNode> targetNodes)
    {
        if (string.IsNullOrWhiteSpace(fromDiagramId) || targetNodes.Count == 0)
        {
            return;
        }

        HashSet<string> targetIds = targetNodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        foreach (DiagramEdge diagramEdge in ast.Edges)
        {
            if (diagramEdge.IsLayoutOnly)
            {
                continue;
            }

            if (string.Equals(diagramEdge.FromNodeId, fromDiagramId, StringComparison.Ordinal)
                && targetIds.Contains(diagramEdge.ToNodeId))
            {
                diagramEdge.Label = string.Empty;
            }
        }
    }

    private static bool IsPrivateEndpointDataPlaneTargetEdge(
        GraphEdge edge,
        GraphNode fromNode,
        GraphNode toNode)
    {
        string fromArmType = DiagramAstGraphNodeClassifier.ReadArmType(fromNode);
        string fromArmId = DiagramAstGraphNodeClassifier.ReadArmId(fromNode);

        if (!IsPrivateEndpointArmResource(fromArmType, fromArmId))
        {
            return false;
        }

        if (IsPrivateEndpointSubnetOrNicAttachment(edge))
        {
            return false;
        }

        string toArmType = DiagramAstGraphNodeClassifier.ReadArmType(toNode);
        string toArmId = DiagramAstGraphNodeClassifier.ReadArmId(toNode);

        if (IsNicOrSubnetArmResource(toArmType, toArmId))
        {
            return false;
        }

        // Typed PE→PaaS edges plus unlabeled ConnectsTo from a PE node to a data-plane resource.
        return string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryPrivateEndpoint, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.Label, AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, GraphEdgeTypes.ConnectsTo, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPrivateEndpointArmResource(string? armType, string armId)
    {
        if (!string.IsNullOrWhiteSpace(armType)
            && armType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return armId.Contains("/privateEndpoints/", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsNicOrSubnetArmResource(string? armType, string armId)
    {
        if (!string.IsNullOrWhiteSpace(armType)
            && (armType.Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase)
                || armType.Contains("/subnets", StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        return armId.Contains("/networkInterfaces/", StringComparison.OrdinalIgnoreCase)
            || armId.Contains("/subnets/", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPrivateEndpointSubnetOrNicAttachment(GraphEdge edge)
    {
        return string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.Label, AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PeToNic, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.Label, AzureInventoryRelationshipAssociationTypes.PeToNic, StringComparison.OrdinalIgnoreCase);
    }
}
