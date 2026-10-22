using ArchLucid.Core.Findings;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Collects resolvable inventory citations from topology graph node property bags.</summary>
public static class FindingGraphEvidenceRefs
{
    private static readonly string[] ProductTypePropertyKeys =
    [
        "type",
        "resourceType",
        "azureType",
        "terraformType",
        "tf.type",
        "awsType",
        "gcpType",
    ];

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
    ///     node id remainder is product-shaped inventory (DX-50 / QR-05) or the node already carries
    ///     a cloud product type (<c>Microsoft.Web/sites</c>, <c>AWS::Lambda::Function</c>,
    ///     <c>google_compute_instance</c>).
    /// </summary>
    public static List<string> CollectWithProductShapedGraphNodeFallback(
        GraphSnapshot graphSnapshot,
        IEnumerable<string> nodeIds)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);
        ArgumentNullException.ThrowIfNull(nodeIds);

        List<string> evidenceRefs = CollectFromNodeIds(graphSnapshot, nodeIds);
        HashSet<string> nodeIdSet = nodeIds
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(static id => id.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (string nodeId in nodeIdSet)
        {
            string graphNodeRef = $"graph-node:{nodeId}";

            if (GenericArchitectureAdvicePatterns.HasProductShapedInventoryEvidence([graphNodeRef]))
                FindingEvidenceRefs.TryAppendDistinct(evidenceRefs, graphNodeRef);
        }

        foreach (GraphNode node in graphSnapshot.Nodes)
        {
            if (!nodeIdSet.Contains(node.NodeId))
                continue;

            TryCollectProductShapedGraphNodeCitation(evidenceRefs, node);
        }

        return evidenceRefs;
    }

    /// <summary>
    ///     Appends <c>graph-node:</c> citations from a node's id or type properties when those tokens
    ///     are product-shaped inventory (ARM/ARN/GCP names or cloud resource types).
    /// </summary>
    public static void TryCollectProductShapedGraphNodeCitation(List<string> evidenceRefs, GraphNode node)
    {
        ArgumentNullException.ThrowIfNull(evidenceRefs);
        ArgumentNullException.ThrowIfNull(node);

        foreach (string candidate in EnumerateProductShapedCitationCandidates(node))
        {
            string graphNodeRef = $"graph-node:{candidate}";

            if (!FindingEvidenceRefs.IsProductShapedInventoryToken(candidate))
                continue;

            FindingEvidenceRefs.TryAppendDistinct(evidenceRefs, graphNodeRef);
        }
    }

    private static IEnumerable<string> EnumerateProductShapedCitationCandidates(GraphNode node)
    {
        if (!string.IsNullOrWhiteSpace(node.NodeId))
            yield return node.NodeId.Trim();

        if (!string.IsNullOrWhiteSpace(node.SourceType))
            yield return node.SourceType.Trim();

        if (node.Properties is null)
            yield break;

        foreach (string key in ProductTypePropertyKeys)
        {
            string? value = TryGetPropertyIgnoreCase(node.Properties, key);

            if (string.IsNullOrWhiteSpace(value))
                continue;

            yield return value.Trim();
        }
    }

    private static string? TryGetPropertyIgnoreCase(IReadOnlyDictionary<string, string> properties, string key)
    {
        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (!string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase))
                continue;

            if (string.IsNullOrWhiteSpace(entry.Value))
                return null;

            return entry.Value;
        }

        return null;
    }
}
