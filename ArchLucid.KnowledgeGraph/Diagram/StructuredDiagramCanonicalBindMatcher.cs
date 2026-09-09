using ArchLucid.KnowledgeGraph.Materialization;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Diagram;

/// <summary>
///     Deterministic matchers from diagram labels/ids to already-materialized graph nodes (AS-018).
/// </summary>
public static class StructuredDiagramCanonicalBindMatcher
{
    public static GraphNode? TryBindDiagramNode(
        string diagramNodeId,
        string diagramLabel,
        IReadOnlyList<GraphNode> bindTargets)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(diagramNodeId);
        ArgumentNullException.ThrowIfNull(bindTargets);

        string? armResourceId = TryExtractArmResourceId(diagramLabel);

        if (armResourceId is not null)
        {
            GraphNode? byArm = TryMatchExactIdentity(armResourceId, bindTargets);

            if (byArm is not null)
            {
                return byArm;
            }
        }

        GraphNode? byDiagramNodeId = TryMatchExactIdentity(diagramNodeId, bindTargets);

        if (byDiagramNodeId is not null)
        {
            return byDiagramNodeId;
        }

        // Display labels bind only when they uniquely match a single topology label (never first-match).
        return TryMatchUniqueDisplayName(diagramLabel, bindTargets);
    }

    private static GraphNode? TryMatchExactIdentity(string candidate, IReadOnlyList<GraphNode> bindTargets)
    {
        if (string.IsNullOrWhiteSpace(candidate))
        {
            return null;
        }

        string needle = candidate.Trim();

        foreach (GraphNode node in bindTargets)
        {
            if (node is null)
            {
                continue;
            }

            if (DeclarationExistingNodeResolver.NodeMatchesDeclaredId(node, needle)
                && !DeclarationExistingNodeResolver.IdsEqual(node.Label, needle))
            {
                return node;
            }
        }

        return null;
    }

    private static GraphNode? TryMatchUniqueDisplayName(string label, IReadOnlyList<GraphNode> bindTargets)
    {
        if (string.IsNullOrWhiteSpace(label))
        {
            return null;
        }

        List<GraphNode> matches = [];

        foreach (GraphNode node in bindTargets)
        {
            if (node is null)
            {
                continue;
            }

            if (DeclarationExistingNodeResolver.IdsEqual(node.Label, label))
            {
                matches.Add(node);
            }
        }

        if (matches.Count != 1)
        {
            return null;
        }

        return matches[0];
    }

    private static string? TryExtractArmResourceId(string label)
    {
        if (string.IsNullOrWhiteSpace(label))
        {
            return null;
        }

        string trimmed = label.Trim();

        if (!trimmed.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return trimmed;
    }
}
