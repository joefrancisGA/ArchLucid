using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Resolves cited indirect relationships for inventory diagram edges (NR-04).
///     Collocation, naming similarity, and compatible-type inference are excluded.
/// </summary>
public static class InventoryDiagramIndirectRelationshipResolver
{
    public static IReadOnlyList<InventoryDiagramIndirectRelationshipResolvedEdge> Resolve(
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlySet<string> visibleDiagramNodeIds)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);
        ArgumentNullException.ThrowIfNull(visibleDiagramNodeIds);

        if (graph.Edges.Count == 0 || visibleDiagramNodeIds.Count == 0)
        {
            return [];
        }

        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        Dictionary<string, string> armIdToDiagramNodeId = BuildArmIdToDiagramNodeId(graphToDiagramNodeId, graphNodesById);
        Dictionary<string, string> nicArmIdToOwnerArmId = BuildNicOwnerArmIdMap(graph, graphNodesById);
        Dictionary<string, List<string>> nicNodeIdToSubnetNodeIds = BuildNicToSubnetMap(graph);
        List<InventoryDiagramIndirectRelationshipResolvedEdge> resolved = [];
        HashSet<string> resolvedKeys = new(StringComparer.Ordinal);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!IsCitedEdge(edge))
            {
                continue;
            }

            if (!graphToDiagramNodeId.TryGetValue(edge.FromNodeId, out string? fromDiagramNodeId)
                || !graphToDiagramNodeId.TryGetValue(edge.ToNodeId, out string? toDiagramNodeId)
                || !visibleDiagramNodeIds.Contains(fromDiagramNodeId)
                || !visibleDiagramNodeIds.Contains(toDiagramNodeId))
            {
                continue;
            }

            graphNodesById.TryGetValue(edge.FromNodeId, out GraphNode? fromNode);
            graphNodesById.TryGetValue(edge.ToNodeId, out GraphNode? toNode);

            InventoryDiagramEvidenceCurrency evidenceCurrency = ResolveEvidenceCurrency(edge, fromNode);
            string relationshipLabel = ResolveRelationshipLabel(edge, fromNode, toNode);
            string resolvedKey = BuildResolvedKey(fromDiagramNodeId, toDiagramNodeId, edge.InferenceSource);

            if (!resolvedKeys.Add(resolvedKey))
            {
                continue;
            }

            resolved.Add(new InventoryDiagramIndirectRelationshipResolvedEdge
            {
                FromDiagramNodeId = fromDiagramNodeId,
                ToDiagramNodeId = toDiagramNodeId,
                InferenceSource = edge.InferenceSource ?? string.Empty,
                RelationshipLabel = relationshipLabel,
                EvidenceCurrency = evidenceCurrency,
            });
        }

        AddDerivedVirtualMachineSubnetEdges(
            graph,
            graphToDiagramNodeId,
            visibleDiagramNodeIds,
            graphNodesById,
            armIdToDiagramNodeId,
            nicArmIdToOwnerArmId,
            nicNodeIdToSubnetNodeIds,
            resolved,
            resolvedKeys);

        return resolved;
    }

    public static InventoryDiagramEvidenceCurrency ResolveEvidenceCurrency(
        GraphEdge edge,
        GraphNode? fromNode)
    {
        ArgumentNullException.ThrowIfNull(edge);

        if (edge.Properties.TryGetValue(
                InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceCurrency,
                out string? edgeCurrency)
            && Enum.TryParse(edgeCurrency, ignoreCase: true, out InventoryDiagramEvidenceCurrency parsedEdgeCurrency))
        {
            return parsedEdgeCurrency;
        }

        if (string.Equals(
                edge.InferenceSource,
                InventoryDiagramIndirectRelationshipEdgeSources.ObservedDependency,
                StringComparison.OrdinalIgnoreCase))
        {
            return InventoryDiagramEvidenceCurrency.Observed;
        }

        if (string.Equals(edge.ProvenanceKind, ProvenanceKind.DerivedFact.ToString(), StringComparison.OrdinalIgnoreCase)
            && IsDerivedInferenceSource(edge.InferenceSource))
        {
            return InventoryDiagramEvidenceCurrency.Derived;
        }

        if (fromNode is not null
            && fromNode.Properties.TryGetValue(
                InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceCurrency,
                out string? nodeCurrency)
            && Enum.TryParse(nodeCurrency, ignoreCase: true, out InventoryDiagramEvidenceCurrency parsedNodeCurrency))
        {
            return parsedNodeCurrency;
        }

        return InventoryDiagramEvidenceCurrency.Current;
    }

    public static bool IsCitedEdge(GraphEdge edge)
    {
        ArgumentNullException.ThrowIfNull(edge);

        if (edge.Properties.ContainsKey(InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceCurrency)
            || edge.Properties.ContainsKey(InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceSource))
        {
            return true;
        }

        if (AzureInventoryRelationshipAssociationTypes.IsKnown(edge.EdgeType))
        {
            return true;
        }

        return IsCitedInferenceSource(edge.InferenceSource);
    }

    private static bool IsCitedInferenceSource(string? inferenceSource)
    {
        return string.Equals(
                   inferenceSource,
                   InventoryDiagramIndirectRelationshipEdgeSources.ObservedDependency,
                   StringComparison.OrdinalIgnoreCase)
               || string.Equals(
                   inferenceSource,
                   InventoryDiagramIndirectRelationshipEdgeSources.PrivateEndpoint,
                   StringComparison.OrdinalIgnoreCase)
               || string.Equals(
                   inferenceSource,
                   InventoryDiagramIndirectRelationshipEdgeSources.PropertyArmId,
                   StringComparison.OrdinalIgnoreCase)
               || string.Equals(
                   inferenceSource,
                   InventoryDiagramIndirectRelationshipEdgeSources.IndirectDerivedRelationship,
                   StringComparison.OrdinalIgnoreCase)
               || IsKnownAssociationTypeMappedInferenceSource(inferenceSource);
    }

    private static bool IsKnownAssociationTypeMappedInferenceSource(string? inferenceSource)
    {
        if (string.IsNullOrWhiteSpace(inferenceSource))
        {
            return false;
        }

        foreach (AzureInventoryRelationshipAssociationTypeDefinition definition in
                 AzureInventoryRelationshipAssociationTypes.All)
        {
            if (string.Equals(
                    inferenceSource,
                    definition.DefaultInferenceSource,
                    StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static void AddDerivedVirtualMachineSubnetEdges(
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlySet<string> visibleDiagramNodeIds,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        IReadOnlyDictionary<string, string> armIdToDiagramNodeId,
        IReadOnlyDictionary<string, string> nicArmIdToOwnerArmId,
        IReadOnlyDictionary<string, List<string>> nicNodeIdToSubnetNodeIds,
        List<InventoryDiagramIndirectRelationshipResolvedEdge> resolved,
        HashSet<string> resolvedKeys)
    {
        foreach (GraphEdge edge in graph.Edges)
        {
            if (!IsVmToNicEdge(edge)
                || !graphNodesById.TryGetValue(edge.ToNodeId, out GraphNode? nicNode)
                || !graphNodesById.TryGetValue(edge.FromNodeId, out GraphNode? vmNode))
            {
                continue;
            }

            if (!graphToDiagramNodeId.TryGetValue(edge.FromNodeId, out string? vmDiagramNodeId)
                || !visibleDiagramNodeIds.Contains(vmDiagramNodeId))
            {
                continue;
            }

            string nicArmId = ReadArmId(nicNode);
            string nicName = ReadResourceName(nicArmId, nicNode.Label);

            if (!nicNodeIdToSubnetNodeIds.TryGetValue(edge.ToNodeId, out List<string>? subnetNodeIds))
            {
                continue;
            }

            foreach (string subnetNodeId in subnetNodeIds)
            {
                if (!graphToDiagramNodeId.TryGetValue(subnetNodeId, out string? subnetDiagramNodeId)
                    || !visibleDiagramNodeIds.Contains(subnetDiagramNodeId))
                {
                    continue;
                }

                string resolvedKey = BuildResolvedKey(
                    vmDiagramNodeId,
                    subnetDiagramNodeId,
                    InventoryDiagramIndirectRelationshipEdgeSources.IndirectDerivedRelationship);

                if (!resolvedKeys.Add(resolvedKey))
                {
                    continue;
                }

                resolved.Add(new InventoryDiagramIndirectRelationshipResolvedEdge
                {
                    FromDiagramNodeId = vmDiagramNodeId,
                    ToDiagramNodeId = subnetDiagramNodeId,
                    InferenceSource = InventoryDiagramIndirectRelationshipEdgeSources.IndirectDerivedRelationship,
                    RelationshipLabel = $"via NIC: {nicName}",
                    EvidenceCurrency = InventoryDiagramEvidenceCurrency.Derived,
                    DerivedHopLabels = [$"NIC {nicName}"],
                });
            }
        }
    }

    private static string ResolveRelationshipLabel(GraphEdge edge, GraphNode? fromNode, GraphNode? toNode)
    {
        if (edge.Properties.TryGetValue(
                InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceSource,
                out string? evidenceSource)
            && !string.IsNullOrWhiteSpace(evidenceSource))
        {
            return evidenceSource.Trim();
        }

        if (string.Equals(
                edge.InferenceSource,
                InventoryDiagramIndirectRelationshipEdgeSources.PrivateEndpoint,
                StringComparison.OrdinalIgnoreCase)
            || string.Equals(
                edge.EdgeType,
                AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget,
                StringComparison.OrdinalIgnoreCase))
        {
            string targetName = ReadResourceName(
                toNode is null ? string.Empty : ReadArmId(toNode),
                toNode?.Label ?? "target");
            return $"private endpoint → {targetName}";
        }

        if (string.Equals(
                edge.InferenceSource,
                InventoryDiagramIndirectRelationshipEdgeSources.ObservedDependency,
                StringComparison.OrdinalIgnoreCase))
        {
            string targetName = ReadResourceName(
                toNode is null ? string.Empty : ReadArmId(toNode),
                toNode?.Label ?? "target");
            return $"observed call → {targetName}";
        }

        if (string.Equals(
                edge.InferenceSource,
                InventoryDiagramIndirectRelationshipEdgeSources.PropertyArmId,
                StringComparison.OrdinalIgnoreCase))
        {
            string targetName = ReadResourceName(
                toNode is null ? string.Empty : ReadArmId(toNode),
                toNode?.Label ?? "target");
            return $"mount → {targetName}";
        }

        if (!string.IsNullOrWhiteSpace(edge.Label))
        {
            return edge.Label.Trim();
        }

        if (!string.IsNullOrWhiteSpace(edge.EdgeType))
        {
            return edge.EdgeType.Trim();
        }

        return edge.InferenceSource?.Trim() ?? "connected";
    }

    private static Dictionary<string, string> BuildArmIdToDiagramNodeId(
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById)
    {
        Dictionary<string, string> armIdToDiagramNodeId = new(StringComparer.OrdinalIgnoreCase);

        foreach ((string graphNodeId, string diagramNodeId) in graphToDiagramNodeId)
        {
            if (!graphNodesById.TryGetValue(graphNodeId, out GraphNode? graphNode))
            {
                continue;
            }

            string armId = ReadArmId(graphNode);

            if (!string.IsNullOrWhiteSpace(armId))
            {
                armIdToDiagramNodeId[ArmResourceIdNormalizer.Normalize(armId)] = diagramNodeId;
            }
        }

        return armIdToDiagramNodeId;
    }

    private static Dictionary<string, string> BuildNicOwnerArmIdMap(
        GraphSnapshot graph,
        IReadOnlyDictionary<string, GraphNode> graphNodesById)
    {
        Dictionary<string, string> nicOwnerArmIdByNicArmId = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!IsVmToNicEdge(edge)
                || !graphNodesById.TryGetValue(edge.FromNodeId, out GraphNode? ownerNode)
                || !graphNodesById.TryGetValue(edge.ToNodeId, out GraphNode? nicNode))
            {
                continue;
            }

            string ownerArmId = ArmResourceIdNormalizer.Normalize(ReadArmId(ownerNode));
            string nicArmId = ArmResourceIdNormalizer.Normalize(ReadArmId(nicNode));

            if (!string.IsNullOrWhiteSpace(ownerArmId) && !string.IsNullOrWhiteSpace(nicArmId))
            {
                nicOwnerArmIdByNicArmId[nicArmId] = ownerArmId;
            }
        }

        return nicOwnerArmIdByNicArmId;
    }

    private static Dictionary<string, List<string>> BuildNicToSubnetMap(GraphSnapshot graph)
    {
        Dictionary<string, List<string>> nicNodeIdToSubnetNodeIds = new(StringComparer.Ordinal);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!IsNicToSubnetEdge(edge))
            {
                continue;
            }

            if (!nicNodeIdToSubnetNodeIds.TryGetValue(edge.FromNodeId, out List<string>? subnetNodeIds))
            {
                subnetNodeIds = [];
                nicNodeIdToSubnetNodeIds[edge.FromNodeId] = subnetNodeIds;
            }

            if (!subnetNodeIds.Contains(edge.ToNodeId, StringComparer.Ordinal))
            {
                subnetNodeIds.Add(edge.ToNodeId);
            }
        }

        return nicNodeIdToSubnetNodeIds;
    }

    private static bool IsVmToNicEdge(GraphEdge edge)
    {
        return string.Equals(edge.InferenceSource, InventoryDiagramIndirectRelationshipEdgeSources.VmNic, StringComparison.OrdinalIgnoreCase)
               || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.VmToNic, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsNicToSubnetEdge(GraphEdge edge)
    {
        return string.Equals(edge.InferenceSource, InventoryDiagramIndirectRelationshipEdgeSources.NicSubnet, StringComparison.OrdinalIgnoreCase)
               || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.NicToSubnet, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsDerivedInferenceSource(string? inferenceSource)
    {
        return string.Equals(
                   inferenceSource,
                   InventoryDiagramIndirectRelationshipEdgeSources.IndirectDerivedRelationship,
                   StringComparison.OrdinalIgnoreCase)
               || string.Equals(
                   inferenceSource,
                   InventoryDiagramIndirectRelationshipEdgeSources.NicSubnet,
                   StringComparison.OrdinalIgnoreCase);
    }

    private static string BuildResolvedKey(string fromDiagramNodeId, string toDiagramNodeId, string? inferenceSource)
    {
        return $"{fromDiagramNodeId}|{toDiagramNodeId}|{inferenceSource ?? string.Empty}";
    }

    private static string ReadArmId(GraphNode node)
    {
        return node.Properties.TryGetValue("arm.id", out string? armId) ? armId : string.Empty;
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
}
