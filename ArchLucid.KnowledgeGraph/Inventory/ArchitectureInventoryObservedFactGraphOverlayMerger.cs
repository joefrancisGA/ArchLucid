using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.KnowledgeGraph.Inventory;

/// <summary>
///     Merges bound inventory snapshot nodes into an authority review graph (AS-050).
///     Merge order: structured diagram compile (AS-016) and canonical bind (AS-018) run during context graph build;
///     inventory <see cref="Diagram.StructuredDiagramGraphProvenanceKinds.ObservedFact" /> overlay is applied after that
///     resolution step so sealed graphs can cite <c>cloudResourceId</c> without minting prose facts.
/// </summary>
public static class ArchitectureInventoryObservedFactGraphOverlayMerger
{
    public static GraphSnapshot Merge(GraphSnapshot baseGraph, GraphSnapshot inventoryOverlay)
    {
        ArgumentNullException.ThrowIfNull(baseGraph);
        ArgumentNullException.ThrowIfNull(inventoryOverlay);

        HashSet<string> baseNodeIds = baseGraph.Nodes
            .Select(static node => NormalizeNodeId(node.NodeId))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        HashSet<string> existingNodeIds = new(baseNodeIds, StringComparer.OrdinalIgnoreCase);

        List<GraphNode> mergedNodes = [.. baseGraph.Nodes];

        foreach (GraphNode inventoryNode in inventoryOverlay.Nodes)
        {
            string normalizedInventoryNodeId = NormalizeNodeId(inventoryNode.NodeId);

            if (existingNodeIds.Contains(normalizedInventoryNodeId))
            {
                if (!baseNodeIds.Contains(normalizedInventoryNodeId))
                {
                    GraphNode retainedNode = mergedNodes.First(node =>
                        string.Equals(
                            NormalizeNodeId(node.NodeId),
                            normalizedInventoryNodeId,
                            StringComparison.OrdinalIgnoreCase));

                    TryValidateOverlayNodeAgreement(inventoryNode, retainedNode);
                    TryMergeOverlayNodePropertyBackfillFromDuplicateRow(inventoryNode, retainedNode);
                    TryMergeOverlayNodeLabelBackfillFromDuplicateRow(inventoryNode, retainedNode);
                    TryMergeOverlayNodeCategoryBackfillFromDuplicateRow(inventoryNode, retainedNode);
                    TryMergeOverlayNodeSourceIdBackfillFromDuplicateRow(inventoryNode, retainedNode);
                }

                continue;
            }

            GraphNode normalizedNode = NormalizeOverlayNode(inventoryNode);
            mergedNodes.Add(normalizedNode);
            existingNodeIds.Add(NormalizeNodeId(normalizedNode.NodeId));
        }

        HashSet<string> baseEdgeKeys = baseGraph.Edges
            .Select(static edge => BuildEdgeKey(edge))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        HashSet<string> edgeKeys = new(baseEdgeKeys, StringComparer.OrdinalIgnoreCase);

        List<GraphEdge> mergedEdges = [.. baseGraph.Edges];

        foreach (GraphEdge inventoryEdge in inventoryOverlay.Edges)
        {
            if (!existingNodeIds.Contains(NormalizeNodeId(inventoryEdge.FromNodeId))
                || !existingNodeIds.Contains(NormalizeNodeId(inventoryEdge.ToNodeId)))
            {
                continue;
            }

            string edgeKey = BuildEdgeKey(inventoryEdge);

            if (!edgeKeys.Add(edgeKey))
            {
                if (!baseEdgeKeys.Contains(edgeKey))
                {
                    GraphEdge retainedEdge = mergedEdges.First(edge =>
                        string.Equals(BuildEdgeKey(edge), edgeKey, StringComparison.OrdinalIgnoreCase));

                    TryValidateOverlayEdgeAgreement(inventoryEdge, retainedEdge);
                    TryMergeOverlayEdgePropertyBackfillFromDuplicateRow(inventoryEdge, retainedEdge);
                    TryMergeOverlayEdgeLabelBackfillFromDuplicateRow(inventoryEdge, retainedEdge);
                }

                continue;
            }

            mergedEdges.Add(NormalizeOverlayEdge(inventoryEdge));
        }

        List<string> warnings = MergeWarnings(baseGraph.Warnings, inventoryOverlay.Warnings);

        return new GraphSnapshot
        {
            GraphSnapshotId = baseGraph.GraphSnapshotId,
            ContextSnapshotId = baseGraph.ContextSnapshotId,
            RunId = baseGraph.RunId,
            CreatedUtc = baseGraph.CreatedUtc,
            SchemaVersion = baseGraph.SchemaVersion,
            Nodes = mergedNodes,
            Edges = mergedEdges,
            Warnings = warnings,
        };
    }

    private static List<string> MergeWarnings(
        IReadOnlyList<string> baseWarnings,
        IReadOnlyList<string> overlayWarnings)
    {
        HashSet<string> seen = new(StringComparer.OrdinalIgnoreCase);
        List<string> merged = [];

        foreach (string warning in baseWarnings)
        {
            string normalized = NormalizeWarning(warning);

            if (normalized.Length == 0 || !seen.Add(normalized))
            {
                continue;
            }

            merged.Add(normalized);
        }

        foreach (string warning in overlayWarnings)
        {
            string normalized = NormalizeWarning(warning);

            if (normalized.Length == 0 || !seen.Add(normalized))
            {
                continue;
            }

            merged.Add(normalized);
        }

        return merged;
    }

    private static string NormalizeWarning(string? warning) => (warning ?? string.Empty).Trim();

    private static string NormalizeNodeId(string nodeId) => nodeId.Trim();

    private static void TryValidateOverlayNodeAgreement(GraphNode incomingNode, GraphNode retainedNode)
    {
        TryValidateOverlayNodeLabelAgreement(incomingNode, retainedNode);
        TryValidateOverlayNodeCategoryAgreement(incomingNode, retainedNode);
        TryValidateOverlayNodeTypeAgreement(incomingNode, retainedNode);
        TryValidateOverlayNodeSourceIdAgreement(incomingNode, retainedNode);
        TryValidateOverlayNodeSourceTypeAgreement(incomingNode, retainedNode);
        TryValidateOverlayNodePropertyBagAgreement(incomingNode, retainedNode);
        TryValidateOverlayNodeReasoningTraceAgreement(incomingNode, retainedNode);
    }

    private static void TryValidateOverlayNodeLabelAgreement(GraphNode incomingNode, GraphNode retainedNode)
    {
        string incomingLabel = (incomingNode.Label ?? string.Empty).Trim();
        string retainedLabel = (retainedNode.Label ?? string.Empty).Trim();

        if (incomingLabel.Length == 0 || retainedLabel.Length == 0)
        {
            return;
        }

        if (!string.Equals(retainedLabel, incomingLabel, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "Inventory overlay duplicate nodes disagree on Label for the same normalized NodeId.");
        }
    }

    private static void TryValidateOverlayNodeCategoryAgreement(GraphNode incomingNode, GraphNode retainedNode)
    {
        string incomingCategory = (incomingNode.Category ?? string.Empty).Trim();
        string retainedCategory = (retainedNode.Category ?? string.Empty).Trim();

        if (incomingCategory.Length == 0 || retainedCategory.Length == 0)
        {
            return;
        }

        if (!string.Equals(retainedCategory, incomingCategory, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "Inventory overlay duplicate nodes disagree on Category for the same normalized NodeId.");
        }
    }

    private static void TryValidateOverlayNodeTypeAgreement(GraphNode incomingNode, GraphNode retainedNode)
    {
        string incomingNodeType = (incomingNode.NodeType ?? string.Empty).Trim();
        string retainedNodeType = (retainedNode.NodeType ?? string.Empty).Trim();

        if (incomingNodeType.Length == 0 || retainedNodeType.Length == 0)
        {
            return;
        }

        if (!string.Equals(retainedNodeType, incomingNodeType, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "Inventory overlay duplicate nodes disagree on NodeType for the same normalized NodeId.");
        }
    }

    private static void TryValidateOverlayNodeSourceIdAgreement(GraphNode incomingNode, GraphNode retainedNode)
    {
        string incomingSourceId = (incomingNode.SourceId ?? string.Empty).Trim();
        string retainedSourceId = (retainedNode.SourceId ?? string.Empty).Trim();

        if (incomingSourceId.Length == 0 || retainedSourceId.Length == 0)
        {
            return;
        }

        if (!string.Equals(retainedSourceId, incomingSourceId, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "Inventory overlay duplicate nodes disagree on SourceId for the same normalized NodeId.");
        }
    }

    private static void TryValidateOverlayNodeSourceTypeAgreement(GraphNode incomingNode, GraphNode retainedNode)
    {
        string incomingSourceType = (incomingNode.SourceType ?? string.Empty).Trim();
        string retainedSourceType = (retainedNode.SourceType ?? string.Empty).Trim();

        if (incomingSourceType.Length == 0 || retainedSourceType.Length == 0)
        {
            return;
        }

        if (!string.Equals(retainedSourceType, incomingSourceType, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "Inventory overlay duplicate nodes disagree on SourceType for the same normalized NodeId.");
        }
    }

    private static void TryValidateOverlayNodeReasoningTraceAgreement(GraphNode incomingNode, GraphNode retainedNode)
    {
        string incomingReasoningTrace = (incomingNode.ReasoningTrace ?? string.Empty).Trim();
        string retainedReasoningTrace = (retainedNode.ReasoningTrace ?? string.Empty).Trim();

        if (incomingReasoningTrace.Length == 0 || retainedReasoningTrace.Length == 0)
        {
            return;
        }

        if (!string.Equals(retainedReasoningTrace, incomingReasoningTrace, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "Inventory overlay duplicate nodes disagree on ReasoningTrace for the same normalized NodeId.");
        }
    }

    private static void TryValidateOverlayEdgeAgreement(GraphEdge incomingEdge, GraphEdge retainedEdge)
    {
        TryValidateOverlayEdgeLabelAgreement(incomingEdge, retainedEdge);
        TryValidateOverlayEdgeWeightAgreement(incomingEdge, retainedEdge);
        TryValidateOverlayEdgeInferenceSourceAgreement(incomingEdge, retainedEdge);
        TryValidateOverlayEdgeProvenanceKindAgreement(incomingEdge, retainedEdge);
        TryValidateOverlayEdgeDeclaredConnectionIdAgreement(incomingEdge, retainedEdge);
        TryValidateOverlayEdgeReasoningTraceAgreement(incomingEdge, retainedEdge);
        TryValidateOverlayEdgePropertyBagAgreement(incomingEdge, retainedEdge);
        TryValidateOverlayEdgeEdgeIdAgreement(incomingEdge, retainedEdge);
    }

    private static void TryValidateOverlayEdgeLabelAgreement(GraphEdge incomingEdge, GraphEdge retainedEdge)
    {
        string incomingLabel = (incomingEdge.Label ?? string.Empty).Trim();
        string retainedLabel = (retainedEdge.Label ?? string.Empty).Trim();

        if (incomingLabel.Length == 0 || retainedLabel.Length == 0)
        {
            return;
        }

        if (!string.Equals(retainedLabel, incomingLabel, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "Inventory overlay duplicate edges disagree on Label for the same directed edge key.");
        }
    }

    private static void TryValidateOverlayEdgeWeightAgreement(GraphEdge incomingEdge, GraphEdge retainedEdge)
    {
        if (OverlayEdgeWeightsAgree(incomingEdge.Weight, retainedEdge.Weight))
        {
            return;
        }

        throw new ArgumentException(
            "Inventory overlay duplicate edges disagree on Weight for the same directed edge key.");
    }

    private static bool OverlayEdgeWeightsAgree(double incomingWeight, double retainedWeight) =>
        Math.Abs(incomingWeight - retainedWeight) <= 1e-9;

    private static void TryValidateOverlayEdgeInferenceSourceAgreement(GraphEdge incomingEdge, GraphEdge retainedEdge)
    {
        string incomingInferenceSource = (incomingEdge.InferenceSource ?? string.Empty).Trim();
        string retainedInferenceSource = (retainedEdge.InferenceSource ?? string.Empty).Trim();

        if (incomingInferenceSource.Length == 0 || retainedInferenceSource.Length == 0)
        {
            return;
        }

        if (!string.Equals(retainedInferenceSource, incomingInferenceSource, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "Inventory overlay duplicate edges disagree on InferenceSource for the same directed edge key.");
        }
    }

    private static void TryValidateOverlayEdgeProvenanceKindAgreement(GraphEdge incomingEdge, GraphEdge retainedEdge)
    {
        string incomingProvenanceKind = (incomingEdge.ProvenanceKind ?? string.Empty).Trim();
        string retainedProvenanceKind = (retainedEdge.ProvenanceKind ?? string.Empty).Trim();

        if (incomingProvenanceKind.Length == 0 || retainedProvenanceKind.Length == 0)
        {
            return;
        }

        if (!string.Equals(retainedProvenanceKind, incomingProvenanceKind, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "Inventory overlay duplicate edges disagree on ProvenanceKind for the same directed edge key.");
        }
    }

    private static void TryValidateOverlayEdgeDeclaredConnectionIdAgreement(GraphEdge incomingEdge, GraphEdge retainedEdge)
    {
        string incomingDeclaredConnectionId = (incomingEdge.DeclaredConnectionId ?? string.Empty).Trim();
        string retainedDeclaredConnectionId = (retainedEdge.DeclaredConnectionId ?? string.Empty).Trim();

        if (incomingDeclaredConnectionId.Length == 0 || retainedDeclaredConnectionId.Length == 0)
        {
            return;
        }

        if (!string.Equals(retainedDeclaredConnectionId, incomingDeclaredConnectionId, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "Inventory overlay duplicate edges disagree on DeclaredConnectionId for the same directed edge key.");
        }
    }

    private static void TryValidateOverlayEdgeReasoningTraceAgreement(GraphEdge incomingEdge, GraphEdge retainedEdge)
    {
        string incomingReasoningTrace = (incomingEdge.ReasoningTrace ?? string.Empty).Trim();
        string retainedReasoningTrace = (retainedEdge.ReasoningTrace ?? string.Empty).Trim();

        if (incomingReasoningTrace.Length == 0 || retainedReasoningTrace.Length == 0)
        {
            return;
        }

        if (!string.Equals(retainedReasoningTrace, incomingReasoningTrace, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "Inventory overlay duplicate edges disagree on ReasoningTrace for the same directed edge key.");
        }
    }

    private static void TryValidateOverlayEdgeEdgeIdAgreement(GraphEdge incomingEdge, GraphEdge retainedEdge)
    {
        string incomingEdgeId = (incomingEdge.EdgeId ?? string.Empty).Trim();
        string retainedEdgeId = (retainedEdge.EdgeId ?? string.Empty).Trim();

        if (incomingEdgeId.Length == 0 || retainedEdgeId.Length == 0)
        {
            return;
        }

        if (!string.Equals(retainedEdgeId, incomingEdgeId, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "Inventory overlay duplicate edges disagree on EdgeId for the same directed edge key.");
        }
    }

    private static void TryMergeOverlayNodePropertyBackfillFromDuplicateRow(
        GraphNode incomingNode,
        GraphNode retainedNode)
    {
        retainedNode.Properties = MergeOverlayPropertyBackfillFromDuplicateRow(
            incomingNode.Properties,
            retainedNode.Properties);
    }

    private static void TryMergeOverlayNodeLabelBackfillFromDuplicateRow(
        GraphNode incomingNode,
        GraphNode retainedNode)
    {
        string? backfillLabel = ResolveOverlayTrimmedScalarBackfillFromDuplicateRow(
            incomingNode.Label,
            retainedNode.Label);

        if (backfillLabel is not null)
        {
            retainedNode.Label = backfillLabel;
        }
    }

    private static void TryMergeOverlayNodeCategoryBackfillFromDuplicateRow(
        GraphNode incomingNode,
        GraphNode retainedNode)
    {
        string? backfillCategory = ResolveOverlayTrimmedScalarBackfillFromDuplicateRow(
            incomingNode.Category,
            retainedNode.Category);

        if (backfillCategory is not null)
        {
            retainedNode.Category = backfillCategory;
        }
    }

    private static void TryMergeOverlayNodeSourceIdBackfillFromDuplicateRow(
        GraphNode incomingNode,
        GraphNode retainedNode)
    {
        string? backfillSourceId = ResolveOverlayTrimmedScalarBackfillFromDuplicateRow(
            incomingNode.SourceId,
            retainedNode.SourceId);

        if (backfillSourceId is not null)
        {
            retainedNode.SourceId = backfillSourceId;
        }
    }

    private static void TryMergeOverlayEdgeLabelBackfillFromDuplicateRow(
        GraphEdge incomingEdge,
        GraphEdge retainedEdge)
    {
        string? backfillLabel = ResolveOverlayTrimmedScalarBackfillFromDuplicateRow(
            incomingEdge.Label,
            retainedEdge.Label);

        if (backfillLabel is not null)
        {
            retainedEdge.Label = backfillLabel;
        }
    }

    private static string? ResolveOverlayTrimmedScalarBackfillFromDuplicateRow(
        string? incomingValue,
        string? retainedValue)
    {
        string normalizedIncomingValue = (incomingValue ?? string.Empty).Trim();

        if (normalizedIncomingValue.Length == 0)
        {
            return null;
        }

        string normalizedRetainedValue = (retainedValue ?? string.Empty).Trim();

        if (normalizedRetainedValue.Length > 0)
        {
            return null;
        }

        return normalizedIncomingValue;
    }

    private static void TryMergeOverlayEdgePropertyBackfillFromDuplicateRow(
        GraphEdge incomingEdge,
        GraphEdge retainedEdge)
    {
        retainedEdge.Properties = MergeOverlayPropertyBackfillFromDuplicateRow(
            incomingEdge.Properties,
            retainedEdge.Properties);
    }

    private static Dictionary<string, string> MergeOverlayPropertyBackfillFromDuplicateRow(
        IReadOnlyDictionary<string, string>? incomingProperties,
        IReadOnlyDictionary<string, string>? retainedProperties)
    {
        Dictionary<string, string> normalizedIncomingProperties = NormalizeOverlayPropertyBagOrEmpty(incomingProperties);

        if (normalizedIncomingProperties.Count == 0)
        {
            return NormalizeOverlayPropertyBagOrEmpty(retainedProperties);
        }

        Dictionary<string, string> normalizedRetainedProperties = NormalizeOverlayPropertyBagOrEmpty(retainedProperties);

        foreach (KeyValuePair<string, string> entry in normalizedIncomingProperties)
        {
            if (normalizedRetainedProperties.TryGetValue(entry.Key, out string? existingValue)
                && existingValue.Length > 0)
            {
                continue;
            }

            normalizedRetainedProperties[entry.Key] = entry.Value;
        }

        return normalizedRetainedProperties;
    }

    private static void TryValidateOverlayNodePropertyBagAgreement(GraphNode incomingNode, GraphNode retainedNode) =>
        TryValidateOverlayPropertyBagAgreement(
            incomingNode.Properties,
            retainedNode.Properties,
            "Inventory overlay duplicate nodes disagree on Properties for key '{0}' for the same normalized NodeId.");

    private static void TryValidateOverlayEdgePropertyBagAgreement(GraphEdge incomingEdge, GraphEdge retainedEdge) =>
        TryValidateOverlayPropertyBagAgreement(
            incomingEdge.Properties,
            retainedEdge.Properties,
            "Inventory overlay duplicate edges disagree on Properties for key '{0}' on the same directed edge key.");

    private static void TryValidateOverlayPropertyBagAgreement(
        IReadOnlyDictionary<string, string>? incomingProperties,
        IReadOnlyDictionary<string, string>? retainedProperties,
        string conflictMessageFormat)
    {
        Dictionary<string, string> normalizedIncomingProperties = NormalizeOverlayPropertyBagOrEmpty(incomingProperties);
        Dictionary<string, string> normalizedRetainedProperties = NormalizeOverlayPropertyBagOrEmpty(retainedProperties);

        HashSet<string> propertyKeys = new(normalizedIncomingProperties.Keys, StringComparer.OrdinalIgnoreCase);
        propertyKeys.UnionWith(normalizedRetainedProperties.Keys);

        foreach (string propertyKey in propertyKeys)
        {
            normalizedIncomingProperties.TryGetValue(propertyKey, out string? incomingValue);
            normalizedRetainedProperties.TryGetValue(propertyKey, out string? retainedValue);

            string normalizedIncomingValue = incomingValue ?? string.Empty;
            string normalizedRetainedValue = retainedValue ?? string.Empty;

            if (normalizedIncomingValue.Length == 0 || normalizedRetainedValue.Length == 0)
            {
                continue;
            }

            if (!string.Equals(normalizedRetainedValue, normalizedIncomingValue, StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException(string.Format(conflictMessageFormat, propertyKey));
            }
        }
    }

    private static Dictionary<string, string> NormalizeOverlayPropertyBagOrEmpty(
        IReadOnlyDictionary<string, string>? properties)
    {
        if (properties is null || properties.Count == 0)
        {
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }

        return NormalizeOverlayPropertyBag(properties);
    }

    private static string BuildEdgeKey(GraphEdge edge) =>
        $"{NormalizeNodeId(edge.FromNodeId)}|{NormalizeNodeId(edge.ToNodeId)}|{NormalizeEdgeType(edge.EdgeType)}";

    private static string NormalizeEdgeType(string? edgeType) => (edgeType ?? string.Empty).Trim();

    private static GraphNode NormalizeOverlayNode(GraphNode node) =>
        new()
        {
            NodeId = NormalizeNodeId(node.NodeId),
            NodeType = node.NodeType,
            Label = node.Label,
            Category = node.Category,
            SourceType = node.SourceType,
            SourceId = node.SourceId,
            ReasoningTrace = node.ReasoningTrace,
            Properties = node.Properties is null || node.Properties.Count == 0
                ? []
                : NormalizeOverlayPropertyBag(node.Properties),
        };

    private static GraphEdge NormalizeOverlayEdge(GraphEdge edge) =>
        new()
        {
            EdgeId = edge.EdgeId,
            FromNodeId = NormalizeNodeId(edge.FromNodeId),
            ToNodeId = NormalizeNodeId(edge.ToNodeId),
            EdgeType = NormalizeEdgeType(edge.EdgeType),
            Label = edge.Label,
            Weight = edge.Weight,
            InferenceSource = edge.InferenceSource,
            ProvenanceKind = edge.ProvenanceKind,
            DeclaredConnectionId = edge.DeclaredConnectionId,
            ReasoningTrace = edge.ReasoningTrace,
            Properties = edge.Properties is null || edge.Properties.Count == 0
                ? []
                : NormalizeOverlayPropertyBag(edge.Properties),
        };

    private static Dictionary<string, string> NormalizeOverlayPropertyBag(IReadOnlyDictionary<string, string> properties)
    {
        Dictionary<string, string> normalized = new(StringComparer.OrdinalIgnoreCase);

        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (string.IsNullOrWhiteSpace(entry.Key))
            {
                continue;
            }

            string key = entry.Key.Trim();
            string value = string.IsNullOrWhiteSpace(entry.Value)
                ? string.Empty
                : entry.Value.Trim();

            if (string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            if (normalized.TryGetValue(key, out string? existing)
                && !string.Equals(existing, value, StringComparison.Ordinal))
            {
                throw new ArgumentException(
                    "Inventory overlay properties contain duplicate keys that collide under ordinal case-insensitive comparison.");
            }

            normalized[key] = value;
        }

        return normalized;
    }
}
