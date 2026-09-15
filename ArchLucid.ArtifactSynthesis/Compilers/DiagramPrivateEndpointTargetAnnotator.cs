using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Marks PaaS targets reached through a private endpoint and drops connector captions so labels
///     do not paint over inventory pictograms.
/// </summary>
internal static class DiagramPrivateEndpointTargetAnnotator
{
    public static void Apply(
        DiagramAst ast,
        IReadOnlyList<GraphNode> topologyNodes,
        IReadOnlyList<GraphEdge> graphEdges,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(topologyNodes);
        ArgumentNullException.ThrowIfNull(graphEdges);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        if (ast.Nodes.Count == 0 || graphEdges.Count == 0)
        {
            return;
        }

        Dictionary<string, GraphNode> graphNodesById = topologyNodes.ToDictionary(
            node => node.NodeId,
            StringComparer.Ordinal);
        Dictionary<string, DiagramNode> diagramNodesById = ast.Nodes.ToDictionary(
            node => node.NodeId,
            StringComparer.Ordinal);

        foreach (GraphEdge graphEdge in graphEdges)
        {
            if (!graphToDiagramNodeId.TryGetValue(graphEdge.FromNodeId, out string? fromDiagramId)
                || !graphToDiagramNodeId.TryGetValue(graphEdge.ToNodeId, out string? toDiagramId))
            {
                continue;
            }

            if (!graphNodesById.TryGetValue(graphEdge.FromNodeId, out GraphNode? fromGraphNode))
            {
                continue;
            }

            if (!IsPrivateEndpointDataPlaneTargetEdge(graphEdge, fromGraphNode))
            {
                continue;
            }

            if (diagramNodesById.TryGetValue(toDiagramId, out DiagramNode? targetNode))
            {
                targetNode.HasPrivateEndpointAccess = true;
            }

            foreach (DiagramEdge diagramEdge in ast.Edges)
            {
                if (diagramEdge.IsLayoutOnly)
                {
                    continue;
                }

                if (string.Equals(diagramEdge.FromNodeId, fromDiagramId, StringComparison.Ordinal)
                    && string.Equals(diagramEdge.ToNodeId, toDiagramId, StringComparison.Ordinal))
                {
                    diagramEdge.Label = string.Empty;
                }
            }
        }
    }

    private static bool IsPrivateEndpointDataPlaneTargetEdge(GraphEdge edge, GraphNode fromNode)
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

        return string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryPrivateEndpoint, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.Label, AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget, StringComparison.OrdinalIgnoreCase);
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

    private static bool IsPrivateEndpointSubnetOrNicAttachment(GraphEdge edge)
    {
        return string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.Label, AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PeToNic, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.Label, AzureInventoryRelationshipAssociationTypes.PeToNic, StringComparison.OrdinalIgnoreCase);
    }
}
