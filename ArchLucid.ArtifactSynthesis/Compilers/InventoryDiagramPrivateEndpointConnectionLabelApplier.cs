using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Labels private-endpoint edges from stored connection status instead of guessing private access.</summary>
internal static class InventoryDiagramPrivateEndpointConnectionLabelApplier
{
    private const string ConnectionStatusPropertyKey = "privateLinkServiceConnectionState.status";

    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        if (ast.Edges.Count == 0)
        {
            return;
        }

        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
        Dictionary<string, string> diagramToGraphNodeId = graphToDiagramNodeId
            .GroupBy(pair => pair.Value, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First().Key, StringComparer.Ordinal);

        foreach (DiagramEdge edge in ast.Edges.Where(candidate => !candidate.IsLayoutOnly))
        {
            if (!IsPrivateEndpointDiagramEdge(edge))
            {
                continue;
            }

            if (ShouldKeepHiddenPrivateAccessShortcut(ast, edge))
            {
                continue;
            }

            GraphNode? privateEndpointNode = ResolvePrivateEndpointGraphNode(
                edge,
                diagramToGraphNodeId,
                graphNodesById,
                graph.Edges);

            edge.Label = InventoryDiagramRelationshipLabelTexts.FormatPrivateEndpointConnectionLabel(
                privateEndpointNode is null ? null : ReadConnectionStatus(privateEndpointNode));
        }
    }

    private static bool ShouldKeepHiddenPrivateAccessShortcut(DiagramAst ast, DiagramEdge edge)
    {
        if (!string.Equals(edge.Label, InventoryDiagramRelationshipLabelTexts.PrivateAccess, StringComparison.Ordinal))
        {
            return false;
        }

        if (TouchesOffCanvasExternalTarget(ast, edge))
        {
            return false;
        }

        return !ast.Nodes.Any(node =>
            (string.Equals(node.NodeId, edge.FromNodeId, StringComparison.Ordinal)
                || string.Equals(node.NodeId, edge.ToNodeId, StringComparison.Ordinal))
            && IsPrivateEndpointArmType(node.ArmResourceType));
    }

    private static bool TouchesOffCanvasExternalTarget(DiagramAst ast, DiagramEdge edge)
    {
        foreach (string endpointId in new[] { edge.FromNodeId, edge.ToNodeId })
        {
            DiagramNode? endpoint = ast.Nodes.FirstOrDefault(node =>
                string.Equals(node.NodeId, endpointId, StringComparison.Ordinal));

            if (endpoint is null)
            {
                continue;
            }

            if (endpoint.Label.StartsWith(
                    "Scope subscription was inferred from the first resource on this diagram.",
                    StringComparison.Ordinal))
            {
                return true;
            }
        }

        return false;
    }

    private static bool IsPrivateEndpointArmType(string? armType)
    {
        return !string.IsNullOrWhiteSpace(armType)
            && armType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase)
            && !armType.Contains("managedPrivateEndpoints", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPrivateEndpointDiagramEdge(DiagramEdge edge)
    {
        return string.Equals(
                   edge.InferenceSource,
                   GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                   StringComparison.OrdinalIgnoreCase)
               || string.Equals(edge.Label, InventoryDiagramRelationshipLabelTexts.PrivateAccess, StringComparison.OrdinalIgnoreCase)
               || string.Equals(edge.Label, "private endpoint", StringComparison.OrdinalIgnoreCase);
    }

    private static GraphNode? ResolvePrivateEndpointGraphNode(
        DiagramEdge edge,
        IReadOnlyDictionary<string, string> diagramToGraphNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        IReadOnlyList<GraphEdge> graphEdges)
    {
        if (diagramToGraphNodeId.TryGetValue(edge.FromNodeId, out string? fromGraphNodeId)
            && graphNodesById.TryGetValue(fromGraphNodeId, out GraphNode? fromNode)
            && IsPrivateEndpointGraphNode(fromNode))
        {
            return fromNode;
        }

        if (diagramToGraphNodeId.TryGetValue(edge.ToNodeId, out string? toGraphNodeId)
            && graphNodesById.TryGetValue(toGraphNodeId, out GraphNode? toNode)
            && IsPrivateEndpointGraphNode(toNode))
        {
            return toNode;
        }

        HashSet<string> diagramEndpointGraphIds = new(StringComparer.Ordinal);

        if (diagramToGraphNodeId.TryGetValue(edge.FromNodeId, out string? mappedFrom))
        {
            diagramEndpointGraphIds.Add(mappedFrom);
        }

        if (diagramToGraphNodeId.TryGetValue(edge.ToNodeId, out string? mappedTo))
        {
            diagramEndpointGraphIds.Add(mappedTo);
        }

        foreach (GraphEdge graphEdge in graphEdges)
        {
            if (!string.Equals(
                    graphEdge.InferenceSource,
                    GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!graphNodesById.TryGetValue(graphEdge.FromNodeId, out GraphNode? peNode)
                || !IsPrivateEndpointGraphNode(peNode))
            {
                continue;
            }

            if (diagramEndpointGraphIds.Contains(graphEdge.ToNodeId)
                || diagramEndpointGraphIds.Contains(graphEdge.FromNodeId))
            {
                return peNode;
            }
        }

        return null;
    }

    private static bool IsPrivateEndpointGraphNode(GraphNode graphNode)
    {
        string armType = DiagramAstGraphNodeClassifier.ReadArmType(graphNode);
        string armId = DiagramAstGraphNodeClassifier.ReadArmId(graphNode);

        return (!string.IsNullOrWhiteSpace(armType)
                && armType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase))
            || armId.Contains("/privateEndpoints/", StringComparison.OrdinalIgnoreCase);
    }

    private static string? ReadConnectionStatus(GraphNode privateEndpointNode)
    {
        if (privateEndpointNode.Properties.TryGetValue(ConnectionStatusPropertyKey, out string? status)
            && !string.IsNullOrWhiteSpace(status))
        {
            return status.Trim();
        }

        foreach (KeyValuePair<string, string> property in privateEndpointNode.Properties)
        {
            if (!property.Key.Contains("privateLinkServiceConnectionState", StringComparison.OrdinalIgnoreCase)
                || !property.Key.Contains("status", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(property.Value))
            {
                continue;
            }

            return property.Value.Trim();
        }

        return null;
    }
}
