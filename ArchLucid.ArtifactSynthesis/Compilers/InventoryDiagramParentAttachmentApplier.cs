using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Attaches proven child resources to parent diagram nodes and removes standalone child nodes (NR-03).
/// </summary>
internal static class InventoryDiagramParentAttachmentApplier
{
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

        Dictionary<string, string> armIdToDiagramNodeId = BuildArmIdToDiagramNodeId(ast, graphToDiagramNodeId, graphNodesById);
        Dictionary<string, HashSet<string>> publicIpReferencingParents =
            AzureInventoryParentAttachmentParentResolver.BuildPublicIpReferencingParentArmIdMap(graph.Nodes);
        Dictionary<string, string> nicArmIdToOwnerArmId = BuildNicOwnerArmIdMap(graph);
        HashSet<string> removedDiagramNodeIds = new(StringComparer.Ordinal);

        foreach (DiagramNode diagramNode in ast.Nodes.ToList())
        {
            if (string.IsNullOrWhiteSpace(diagramNode.SeedNodeId)
                || !graphNodesById.TryGetValue(diagramNode.SeedNodeId, out GraphNode? graphNode))
            {
                continue;
            }

            string? armResourceType = DiagramAstGraphNodeClassifier.ReadArmType(graphNode);

            if (!InventoryDiagramParentAttachmentClassifier.TryClassify(
                    armResourceType,
                    out InventoryDiagramParentAttachmentCategory category))
            {
                continue;
            }

            AzureInventoryParentAttachmentResolveResult resolved = AzureInventoryParentAttachmentParentResolver.Resolve(
                graphNode,
                graph,
                publicIpReferencingParents);

            if (resolved.ExcludeFromTopology)
            {
                removedDiagramNodeIds.Add(diagramNode.NodeId);
                continue;
            }

            if (category == InventoryDiagramParentAttachmentCategory.AccessConnector
                && !string.IsNullOrWhiteSpace(resolved.ExternalTargetArmId)
                && TryEmitAccessConnectorExternalTargetEdge(
                    ast,
                    diagramNode,
                    graphNode,
                    resolved,
                    armIdToDiagramNodeId,
                    nicArmIdToOwnerArmId))
            {
                removedDiagramNodeIds.Add(diagramNode.NodeId);
                continue;
            }

            if (!resolved.HasProvenParent)
            {
                continue;
            }

            string childDetailLabel = BuildChildDetailLabel(diagramNode, category);
            InventoryDiagramEvidenceCurrency evidenceCurrencyForDetail = ReadEvidenceCurrency(graphNode);
            string formattedDetail = InventoryDiagramEvidenceCurrencyLabels.Format(evidenceCurrencyForDetail, childDetailLabel);
            int attachedParentCount = 0;

            foreach (string parentArmId in resolved.ParentArmIds)
            {
                string? parentDiagramNodeId = ResolveParentDiagramNodeId(
                    parentArmId,
                    armIdToDiagramNodeId,
                    nicArmIdToOwnerArmId);

                if (string.IsNullOrWhiteSpace(parentDiagramNodeId))
                {
                    continue;
                }

                DiagramNode? parentDiagramNode = ast.Nodes.FirstOrDefault(node => node.NodeId == parentDiagramNodeId);

                if (parentDiagramNode is null)
                {
                    continue;
                }

                if (!parentDiagramNode.ParentAttachmentDetails.Contains(formattedDetail, StringComparer.Ordinal))
                {
                    parentDiagramNode.ParentAttachmentDetails.Add(formattedDetail);
                }

                attachedParentCount++;
            }

            if (attachedParentCount > 0)
            {
                removedDiagramNodeIds.Add(diagramNode.NodeId);
            }
        }

        if (removedDiagramNodeIds.Count == 0)
        {
            return;
        }

        ast.Nodes.RemoveAll(node => removedDiagramNodeIds.Contains(node.NodeId));
        ast.Edges.RemoveAll(edge =>
            removedDiagramNodeIds.Contains(edge.FromNodeId) || removedDiagramNodeIds.Contains(edge.ToNodeId));
    }

    private static string? ResolveFirstParentDiagramNodeId(
        IReadOnlyList<string> parentArmIds,
        IReadOnlyDictionary<string, string> armIdToDiagramNodeId,
        IReadOnlyDictionary<string, string> nicArmIdToOwnerArmId)
    {
        foreach (string parentArmId in parentArmIds)
        {
            string? diagramNodeId = ResolveParentDiagramNodeId(parentArmId, armIdToDiagramNodeId, nicArmIdToOwnerArmId);

            if (!string.IsNullOrWhiteSpace(diagramNodeId))
            {
                return diagramNodeId;
            }
        }

        return null;
    }

    private static bool TryEmitAccessConnectorExternalTargetEdge(
        DiagramAst ast,
        DiagramNode connectorDiagramNode,
        GraphNode connectorGraphNode,
        AzureInventoryParentAttachmentResolveResult resolved,
        IReadOnlyDictionary<string, string> armIdToDiagramNodeId,
        IReadOnlyDictionary<string, string> nicArmIdToOwnerArmId)
    {
        if (!TryResolveDiagramNodeId(
                resolved.ExternalTargetArmId!,
                armIdToDiagramNodeId,
                ast.Nodes,
                out string? externalTargetDiagramNodeId))
        {
            return false;
        }

        string? parentDiagramNodeId = ResolveFirstParentDiagramNodeId(
            resolved.ParentArmIds,
            armIdToDiagramNodeId,
            nicArmIdToOwnerArmId);

        if (string.IsNullOrWhiteSpace(parentDiagramNodeId)
            && connectorGraphNode.Properties.TryGetValue(
                InventoryDiagramParentAttachmentPropertyKeys.AccessConnectorParentArmId,
                out string? citedParentArmId))
        {
            parentDiagramNodeId = ResolveParentDiagramNodeId(
                citedParentArmId,
                armIdToDiagramNodeId,
                nicArmIdToOwnerArmId);
        }

        if (string.IsNullOrWhiteSpace(parentDiagramNodeId)
            || string.IsNullOrWhiteSpace(externalTargetDiagramNodeId))
        {
            return false;
        }

        InventoryDiagramEvidenceCurrency evidenceCurrency = ReadEvidenceCurrency(connectorGraphNode);
        string edgeLabel = InventoryDiagramEvidenceCurrencyLabels.Format(
            evidenceCurrency,
            ReadResourceName(connectorDiagramNode.ArmResourceId, connectorDiagramNode.Label));

        ast.Edges.Add(new DiagramEdge
        {
            FromNodeId = parentDiagramNodeId,
            ToNodeId = externalTargetDiagramNodeId,
            Label = edgeLabel,
            ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
            InferenceSource = GraphEdgeInferenceSources.InventoryAccessConnectorExternalTarget,
        });

        return true;
    }

    private static bool TryResolveDiagramNodeId(
        string armId,
        IReadOnlyDictionary<string, string> armIdToDiagramNodeId,
        IReadOnlyList<DiagramNode> diagramNodes,
        out string? diagramNodeId)
    {
        diagramNodeId = ResolveParentDiagramNodeId(
            armId,
            armIdToDiagramNodeId,
            nicArmIdToOwnerArmId: new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase));

        if (!string.IsNullOrWhiteSpace(diagramNodeId))
        {
            return true;
        }

        string normalizedArmId = ArmResourceIdNormalizer.Normalize(armId);

        foreach (DiagramNode candidate in diagramNodes)
        {
            if (string.IsNullOrWhiteSpace(candidate.ArmResourceId))
            {
                continue;
            }

            if (string.Equals(
                    ArmResourceIdNormalizer.Normalize(candidate.ArmResourceId),
                    normalizedArmId,
                    StringComparison.OrdinalIgnoreCase))
            {
                diagramNodeId = candidate.NodeId;
                return true;
            }
        }

        diagramNodeId = null;
        return false;
    }

    private static string? ResolveParentDiagramNodeId(
        string parentArmId,
        IReadOnlyDictionary<string, string> armIdToDiagramNodeId,
        IReadOnlyDictionary<string, string> nicArmIdToOwnerArmId)
    {
        string normalizedParentArmId = ArmResourceIdNormalizer.Normalize(parentArmId);

        if (armIdToDiagramNodeId.TryGetValue(normalizedParentArmId, out string? diagramNodeId))
        {
            return diagramNodeId;
        }

        if (nicArmIdToOwnerArmId.TryGetValue(normalizedParentArmId, out string? ownerArmId)
            && armIdToDiagramNodeId.TryGetValue(ownerArmId, out string? ownerDiagramNodeId))
        {
            return ownerDiagramNodeId;
        }

        return null;
    }

    private static string BuildChildDetailLabel(
        DiagramNode childNode,
        InventoryDiagramParentAttachmentCategory category)
    {
        string resourceName = ReadResourceName(childNode.ArmResourceId, childNode.Label);

        return category switch
        {
            InventoryDiagramParentAttachmentCategory.PublicIp => $"Public IP: {resourceName}",
            InventoryDiagramParentAttachmentCategory.RestorePointCollection => $"Restore points: {resourceName}",
            InventoryDiagramParentAttachmentCategory.AccessConnector => $"Access connector: {resourceName}",
            _ => resourceName,
        };
    }

    private static string ReadResourceName(string? armResourceId, string fallbackLabel)
    {
        if (string.IsNullOrWhiteSpace(armResourceId))
        {
            return fallbackLabel;
        }

        int lastSlash = armResourceId.LastIndexOf('/');

        if (lastSlash < 0 || lastSlash >= armResourceId.Length - 1)
        {
            return fallbackLabel;
        }

        return armResourceId[(lastSlash + 1)..];
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

    private static InventoryDiagramEvidenceCurrency ReadEvidenceCurrency(GraphNode graphNode)
    {
        if (graphNode.Properties.TryGetValue(
                InventoryDiagramParentAttachmentPropertyKeys.EvidenceCurrency,
                out string? currencyValue)
            && Enum.TryParse(currencyValue, ignoreCase: true, out InventoryDiagramEvidenceCurrency parsed))
        {
            return parsed;
        }

        return InventoryDiagramEvidenceCurrency.Current;
    }
}
