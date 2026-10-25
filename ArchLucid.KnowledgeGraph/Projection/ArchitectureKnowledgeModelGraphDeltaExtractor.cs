using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.KnowledgeGraph.Projection;

/// <summary>
///     Reverse morphism Δ: compares graph snapshots and extracts model-oriented diff entries
///     for change-impact and incremental re-review workflows.
/// </summary>
public static class ArchitectureKnowledgeModelGraphDeltaExtractor
{
    public static List<ArchitectureModelDiffEntry> ExtractGraphDelta(
        GraphSnapshot before,
        GraphSnapshot after)
    {
        ArgumentNullException.ThrowIfNull(before);
        ArgumentNullException.ThrowIfNull(after);

        IReadOnlyList<GraphNode> beforeNodes = before.Nodes ?? [];
        IReadOnlyList<GraphNode> afterNodes = after.Nodes ?? [];

        HashSet<string> beforeNodeIds = beforeNodes
            .Select(static node => NormalizeNodeId(node.NodeId))
            .Where(static nodeId => nodeId.Length > 0)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        HashSet<string> afterNodeIds = afterNodes
            .Select(static node => NormalizeNodeId(node.NodeId))
            .Where(static nodeId => nodeId.Length > 0)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<ArchitectureModelDiffEntry> entries = [];

        foreach (GraphNode node in afterNodes)
        {
            string normalizedNodeId = NormalizeNodeId(node.NodeId);

            if (normalizedNodeId.Length == 0 || beforeNodeIds.Contains(normalizedNodeId))
                continue;

            entries.Add(new ArchitectureModelDiffEntry
            {
                ElementId = FromGraphNodeId(node.NodeId),
                ChangeKind = "Added",
                ElementKind = InferElementKind(node),
                Description = $"Graph node added: {node.Label}",
            });
        }

        foreach (GraphNode node in beforeNodes)
        {
            string normalizedNodeId = NormalizeNodeId(node.NodeId);

            if (normalizedNodeId.Length == 0 || afterNodeIds.Contains(normalizedNodeId))
                continue;

            entries.Add(new ArchitectureModelDiffEntry
            {
                ElementId = FromGraphNodeId(node.NodeId),
                ChangeKind = "Removed",
                ElementKind = InferElementKind(node),
                Description = $"Graph node removed: {node.Label}",
            });
        }

        return entries;
    }

    private static string NormalizeNodeId(string nodeId) => nodeId.Trim();

    private static string FromGraphNodeId(string nodeId)
    {
        string normalized = NormalizeNodeId(nodeId);
        const string prefix = "akm:";

        if (normalized.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            return normalized[prefix.Length..];

        return normalized;
    }

    private static ArchitectureElementKind InferElementKind(GraphNode node)
    {
        if (string.Equals(node.NodeType, GraphNodeTypes.TrustBoundary, StringComparison.OrdinalIgnoreCase))
            return ArchitectureElementKind.TrustBoundary;

        if (string.Equals(node.NodeType, GraphNodeTypes.PolicyControl, StringComparison.OrdinalIgnoreCase))
            return ArchitectureElementKind.ComplianceObligation;

        if (string.Equals(node.NodeType, GraphNodeTypes.FailureMode, StringComparison.OrdinalIgnoreCase))
            return ArchitectureElementKind.FailureMode;

        if (string.Equals(node.NodeType, GraphNodeTypes.CostConstraint, StringComparison.OrdinalIgnoreCase))
            return ArchitectureElementKind.CostDriver;

        return ArchitectureElementKind.Component;
    }
}
