using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Hides network-interface cards and draws public exposure on the owning compute resource instead.
/// </summary>
internal static class DiagramNicCollapseApplier
{
    public static bool ShouldCollapseNetworkInterfaces(DiagramMode mode)
    {
        return mode is DiagramMode.FullSubscription
            or DiagramMode.Network
            or DiagramMode.Executive
            or DiagramMode.Security
            or DiagramMode.Architecture;
    }

    public static List<GraphNode> IncludePublicIpsExposingVisibleOwners(
        GraphSnapshot graph,
        IReadOnlyList<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(nodes);

        if (graph.Edges.Count == 0)
        {
            return nodes.ToList();
        }

        HashSet<string> visibleNodeIds = nodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        Dictionary<string, string> nicNodeIdToOwnerNodeId =
            DiagramNicOwnerResolver.BuildNicNodeIdToOwnerNodeIdMap(graph.Edges, graph.Nodes);

        HashSet<string> publicIpNodeIdsToInclude = new(StringComparer.Ordinal);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (edge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
            {
                continue;
            }

            if (!IsPublicIpExposesNetworkInterfaceEdge(edge, graphNodesById))
            {
                continue;
            }

            if (!nicNodeIdToOwnerNodeId.TryGetValue(edge.ToNodeId, out string? ownerNodeId))
            {
                continue;
            }

            if (!visibleNodeIds.Contains(ownerNodeId))
            {
                continue;
            }

            if (visibleNodeIds.Contains(edge.FromNodeId))
            {
                continue;
            }

            publicIpNodeIdsToInclude.Add(edge.FromNodeId);
        }

        if (publicIpNodeIdsToInclude.Count == 0)
        {
            return nodes.ToList();
        }

        List<GraphNode> expanded = nodes.ToList();

        foreach (string publicIpNodeId in publicIpNodeIdsToInclude.OrderBy(id => id, StringComparer.Ordinal))
        {
            if (!graphNodesById.TryGetValue(publicIpNodeId, out GraphNode? publicIpNode))
            {
                continue;
            }

            expanded.Add(publicIpNode);
        }

        return expanded
            .OrderBy(DiagramAstGraphNodeClassifier.ReadArmId, StringComparer.Ordinal)
            .ToList();
    }

    public static List<GraphNode> IncludeVirtualMachinesAttachedToNetworkInterfaces(
        GraphSnapshot graph,
        IReadOnlyList<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(nodes);

        HashSet<string> includedNodeIds = nodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        Dictionary<string, GraphNode> nodesById = graph.Nodes.ToDictionary(
            node => node.NodeId,
            StringComparer.Ordinal);

        List<GraphNode> expanded = nodes.ToList();

        foreach (GraphEdge edge in graph.Edges)
        {
            if (edge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
            {
                continue;
            }

            if (!DiagramNicOwnerResolver.IsVmToNicEdge(edge))
            {
                continue;
            }

            if (!nodesById.TryGetValue(edge.FromNodeId, out GraphNode? virtualMachineNode))
            {
                continue;
            }

            if (!DiagramAstGraphNodeClassifier.ReadArmType(virtualMachineNode)
                    .Contains("virtualMachines", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (includedNodeIds.Add(virtualMachineNode.NodeId))
            {
                expanded.Add(virtualMachineNode);
            }
        }

        return expanded
            .OrderBy(DiagramAstGraphNodeClassifier.ReadArmId, StringComparer.Ordinal)
            .ToList();
    }

    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        if (ast.Nodes.Count == 0)
        {
            return;
        }

        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        Dictionary<string, string> nicNodeIdToOwnerNodeId =
            DiagramNicOwnerResolver.BuildNicNodeIdToOwnerNodeIdMap(graph.Edges, graph.Nodes);

        HashSet<string> networkInterfaceDiagramNodeIds = ast.Nodes
            .Where(IsNetworkInterfaceDiagramNode)
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        if (networkInterfaceDiagramNodeIds.Count > 0)
        {
            ast.Edges = ast.Edges
                .Where(edge => !TouchesNetworkInterfaceDiagramNode(edge, networkInterfaceDiagramNodeIds))
                .ToList();

            ast.Nodes = ast.Nodes
                .Where(node => !networkInterfaceDiagramNodeIds.Contains(node.NodeId))
                .ToList();
        }

        HashSet<string> visibleEdgeKeys = ast.Edges
            .Where(edge => !edge.IsLayoutOnly)
            .Select(BuildVisibleEdgeKey)
            .ToHashSet(StringComparer.Ordinal);

        foreach (GraphEdge graphEdge in graph.Edges)
        {
            if (graphEdge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
            {
                continue;
            }

            if (!IsPublicIpExposesNetworkInterfaceEdge(graphEdge, graphNodesById))
            {
                continue;
            }

            if (!nicNodeIdToOwnerNodeId.TryGetValue(graphEdge.ToNodeId, out string? ownerGraphNodeId))
            {
                continue;
            }

            if (!graphToDiagramNodeId.TryGetValue(graphEdge.FromNodeId, out string? publicIpDiagramNodeId)
                || !graphToDiagramNodeId.TryGetValue(ownerGraphNodeId, out string? ownerDiagramNodeId))
            {
                continue;
            }

            string edgeKey = BuildVisibleEdgeKey(publicIpDiagramNodeId, ownerDiagramNodeId, GraphEdgeTypes.Exposes);

            if (!visibleEdgeKeys.Add(edgeKey))
            {
                continue;
            }

            ast.Edges.Add(new DiagramEdge
            {
                FromNodeId = publicIpDiagramNodeId,
                ToNodeId = ownerDiagramNodeId,
                Label = DiagramEdgeLabelHumanizer.ResolveDisplayLabel(
                    graphEdge.Label,
                    GraphEdgeTypes.Exposes,
                    graphEdge.InferenceSource),
                ProvenanceKind = graphEdge.ProvenanceKind,
                InferenceSource = graphEdge.InferenceSource,
            });
        }
    }

    private static bool IsPublicIpExposesNetworkInterfaceEdge(
        GraphEdge edge,
        IReadOnlyDictionary<string, GraphNode> graphNodesById)
    {
        if (!graphNodesById.TryGetValue(edge.FromNodeId, out GraphNode? fromNode)
            || !graphNodesById.TryGetValue(edge.ToNodeId, out GraphNode? toNode))
        {
            return false;
        }

        if (!DiagramNicOwnerResolver.IsPublicIpAddressNode(fromNode)
            || !DiagramNicOwnerResolver.IsNetworkInterfaceNode(toNode))
        {
            return false;
        }

        return string.Equals(edge.EdgeType, GraphEdgeTypes.Exposes, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryPublicIp, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PublicIpToNic, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.Label, AzureInventoryRelationshipAssociationTypes.PublicIpToNic, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsNetworkInterfaceDiagramNode(DiagramNode node)
    {
        if (!string.IsNullOrWhiteSpace(node.ArmResourceType)
            && node.ArmResourceType.Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }

    private static bool TouchesNetworkInterfaceDiagramNode(
        DiagramEdge edge,
        IReadOnlySet<string> networkInterfaceDiagramNodeIds)
    {
        return networkInterfaceDiagramNodeIds.Contains(edge.FromNodeId)
            || networkInterfaceDiagramNodeIds.Contains(edge.ToNodeId);
    }

    private static string BuildVisibleEdgeKey(DiagramEdge edge)
    {
        return BuildVisibleEdgeKey(edge.FromNodeId, edge.ToNodeId, edge.Label);
    }

    private static string BuildVisibleEdgeKey(string fromNodeId, string toNodeId, string? label)
    {
        return $"{fromNodeId}|{toNodeId}|{label ?? string.Empty}";
    }
}
