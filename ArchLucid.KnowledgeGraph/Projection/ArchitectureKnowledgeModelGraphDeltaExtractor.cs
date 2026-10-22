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

        HashSet<string> beforeNodeIds = before.Nodes
            .Select(static node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        HashSet<string> afterNodeIds = after.Nodes
            .Select(static node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        List<ArchitectureModelDiffEntry> entries = [];

        foreach (GraphNode node in after.Nodes)
        {
            if (beforeNodeIds.Contains(node.NodeId))
                continue;

            entries.Add(new ArchitectureModelDiffEntry
            {
                ElementId = FromGraphNodeId(node.NodeId),
                ChangeKind = "Added",
                ElementKind = InferElementKind(node),
                Description = $"Graph node added: {node.Label}",
            });
        }

        foreach (GraphNode node in before.Nodes)
        {
            if (afterNodeIds.Contains(node.NodeId))
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

    private static string FromGraphNodeId(string nodeId)
    {
        const string prefix = "akm:";

        if (nodeId.StartsWith(prefix, StringComparison.Ordinal))
            return nodeId[prefix.Length..];

        return nodeId;
    }

    private static ArchitectureElementKind InferElementKind(GraphNode node)
    {
        if (node.NodeType == GraphNodeTypes.TrustBoundary)
            return ArchitectureElementKind.TrustBoundary;

        if (node.NodeType == GraphNodeTypes.PolicyControl)
            return ArchitectureElementKind.ComplianceObligation;

        if (node.NodeType == GraphNodeTypes.FailureMode)
            return ArchitectureElementKind.FailureMode;

        if (node.NodeType == GraphNodeTypes.CostConstraint)
            return ArchitectureElementKind.CostDriver;

        return ArchitectureElementKind.Component;
    }
}
