using ArchLucid.Core.Findings;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Collects resolvable inventory citations from topology graph node property bags.</summary>
public static class FindingGraphEvidenceRefs
{
    public static List<string> CollectFromNodeIds(GraphSnapshot graphSnapshot, IEnumerable<string> nodeIds)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);
        ArgumentNullException.ThrowIfNull(nodeIds);

        List<string> evidenceRefs = [];
        HashSet<string> nodeIdSet = nodeIds
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(static id => id.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (nodeIdSet.Count == 0)
            return evidenceRefs;

        foreach (GraphNode node in graphSnapshot.Nodes)
        {
            if (!nodeIdSet.Contains(node.NodeId))
                continue;

            FindingEvidenceRefs.TryCollectFromNodeProperties(evidenceRefs, node.Properties);
            FindingDiagramEvidenceRefs.TryAppendFromNode(evidenceRefs, node);
        }

        return evidenceRefs;
    }

    /// <summary>
    ///     Collects property- and diagram-backed refs, then appends <c>graph-node:</c> only when the
    ///     node id remainder is product-shaped inventory (DX-50 / QR-05).
    /// </summary>
    public static List<string> CollectWithProductShapedGraphNodeFallback(
        GraphSnapshot graphSnapshot,
        IEnumerable<string> nodeIds)
    {
        List<string> evidenceRefs = CollectFromNodeIds(graphSnapshot, nodeIds);

        foreach (string nodeId in nodeIds)
        {
            if (string.IsNullOrWhiteSpace(nodeId))
                continue;

            string graphNodeRef = $"graph-node:{nodeId.Trim()}";

            if (GenericArchitectureAdvicePatterns.HasProductShapedInventoryEvidence([graphNodeRef]))
                FindingEvidenceRefs.TryAppendDistinct(evidenceRefs, graphNodeRef);
        }

        return evidenceRefs;
    }
}
