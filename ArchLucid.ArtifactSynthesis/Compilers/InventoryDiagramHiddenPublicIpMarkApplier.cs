using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Marks virtual machines public when their public IP card is hidden (NR-21).</summary>
internal static class InventoryDiagramHiddenPublicIpMarkApplier
{
    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        bool retainNetworkDetailNodes)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        if (retainNetworkDetailNodes || ast.Nodes.Count == 0)
        {
            return;
        }

        HashSet<string> visibleDiagramNodeIds = ast.Nodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);
        HashSet<string> visibleGraphNodeIds = graphToDiagramNodeId
            .Where(pair => visibleDiagramNodeIds.Contains(pair.Value))
            .Select(pair => pair.Key)
            .ToHashSet(StringComparer.Ordinal);
        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
        Dictionary<string, string> armIdToDiagramNodeId = BuildArmIdToDiagramNodeId(ast, graphToDiagramNodeId, graphNodesById);
        Dictionary<string, string> nicArmIdToOwnerArmId = BuildNicOwnerArmIdMap(graph);

        foreach (GraphNode graphNode in graph.Nodes)
        {
            if (!IsPublicIpNode(graphNode) || visibleGraphNodeIds.Contains(graphNode.NodeId))
            {
                continue;
            }

            foreach (string ownerArmId in ResolveVmOrScaleSetOwnerArmIds(graphNode, graph, nicArmIdToOwnerArmId))
            {
                if (!armIdToDiagramNodeId.TryGetValue(ownerArmId, out string? ownerDiagramNodeId))
                {
                    continue;
                }

                DiagramNode? ownerDiagramNode = ast.Nodes.FirstOrDefault(node =>
                    string.Equals(node.NodeId, ownerDiagramNodeId, StringComparison.Ordinal));

                if (ownerDiagramNode is null || ShouldSkipPublicMark(ast, ownerDiagramNode))
                {
                    continue;
                }

                ownerDiagramNode.HasPublicInternetExposure = true;
            }
        }
    }

    private static bool ShouldSkipPublicMark(DiagramAst ast, DiagramNode ownerDiagramNode)
    {
        if (ownerDiagramNode.HasPublicInternetExposure)
        {
            return true;
        }

        if (ownerDiagramNode.ParentAttachmentDetails.Any(detail =>
                detail.Contains("Public IP:", StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        return ast.Edges.Any(edge =>
            !edge.IsLayoutOnly
            && string.Equals(edge.ToNodeId, ownerDiagramNode.NodeId, StringComparison.Ordinal)
            && (string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryPublicIp, StringComparison.OrdinalIgnoreCase)
                || string.Equals(edge.Label, "exposes", StringComparison.OrdinalIgnoreCase)));
    }

    private static IReadOnlyList<string> ResolveVmOrScaleSetOwnerArmIds(
        GraphNode publicIpNode,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> nicArmIdToOwnerArmId)
    {
        Dictionary<string, HashSet<string>> publicIpReferencingParents =
            AzureInventoryParentAttachmentParentResolver.BuildPublicIpReferencingParentArmIdMap(graph.Nodes);
        AzureInventoryParentAttachmentResolveResult resolved =
            AzureInventoryParentAttachmentParentResolver.Resolve(
                publicIpNode,
                graph,
                publicIpReferencingParents);

        List<string> ownerArmIds = [];

        foreach (string parentArmId in resolved.ParentArmIds)
        {
            string normalizedParentArmId = ArmResourceIdNormalizer.Normalize(parentArmId);

            if (nicArmIdToOwnerArmId.TryGetValue(normalizedParentArmId, out string? vmArmId))
            {
                ownerArmIds.Add(vmArmId);
                continue;
            }

            if (IsVirtualMachineOrScaleSetArmId(normalizedParentArmId))
            {
                ownerArmIds.Add(normalizedParentArmId);
            }
        }

        return ownerArmIds;
    }

    private static bool IsVirtualMachineOrScaleSetArmId(string armId)
    {
        return armId.Contains("/virtualMachines/", StringComparison.OrdinalIgnoreCase)
            || armId.Contains("/virtualMachineScaleSets/", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPublicIpNode(GraphNode node)
    {
        return string.Equals(
            DiagramAstGraphNodeClassifier.ReadArmType(node),
            "Microsoft.Network/publicIPAddresses",
            StringComparison.OrdinalIgnoreCase);
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

    private static Dictionary<string, string> BuildNicOwnerArmIdMap(GraphSnapshot graph)
    {
        Dictionary<string, string> nicOwnerArmIdByNicArmId = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.VmToNic, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryVmNic, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!graphNodesById.TryGetValue(edge.FromNodeId, out GraphNode? ownerNode)
                || !graphNodesById.TryGetValue(edge.ToNodeId, out GraphNode? nicNode))
            {
                continue;
            }

            string ownerArmId = ArmResourceIdNormalizer.Normalize(DiagramAstGraphNodeClassifier.ReadArmId(ownerNode));
            string nicArmId = ArmResourceIdNormalizer.Normalize(DiagramAstGraphNodeClassifier.ReadArmId(nicNode));

            if (!string.IsNullOrWhiteSpace(ownerArmId) && !string.IsNullOrWhiteSpace(nicArmId))
            {
                nicOwnerArmIdByNicArmId[nicArmId] = ownerArmId;
            }
        }

        return nicOwnerArmIdByNicArmId;
    }
}
