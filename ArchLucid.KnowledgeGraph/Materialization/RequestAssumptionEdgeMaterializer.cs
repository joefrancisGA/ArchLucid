using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Links structured-brief assumption nodes to related requirements and actors via text heuristics (TB-2347).
/// </summary>
public static class RequestAssumptionEdgeMaterializer
{
    private const int MinimumTokenLength = 4;

    private const int MaxTargetsPerAssumption = 8;

    private static readonly string[] LinkTargetNodeTypes =
    [
        GraphNodeTypes.Requirement,
        GraphNodeTypes.Actor,
    ];

    public static IReadOnlyList<GraphEdge> Materialize(IReadOnlyList<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(nodes);

        List<GraphEdge> edges = [];

        foreach (GraphNode assumption in nodes.Where(IsStructuredBriefAssumption))
        {
            string assumptionText = ReadAssumptionText(assumption);

            if (string.IsNullOrWhiteSpace(assumptionText))
                continue;

            IReadOnlyList<string> tokens = Tokenize(assumptionText);
            int linkedTargets = 0;

            foreach (GraphNode target in nodes.Where(IsLinkTarget))
            {
                if (!AssumptionTextMatchesTarget(assumptionText, tokens, target))
                    continue;

                edges.Add(
                    GraphEdgeInferenceHelpers.CreateEdge(
                        assumption.NodeId,
                        target.NodeId,
                        GraphEdgeTypes.RelatesTo,
                        "Confirmed assumption relates to graph fact",
                        0.85,
                        GraphEdgeInferenceSources.StructuredBriefAssumptionLink));

                linkedTargets++;

                if (linkedTargets >= MaxTargetsPerAssumption)
                    break;
            }
        }

        return GraphEdgeInferenceHelpers.Deduplicate(edges);
    }

    private static bool IsStructuredBriefAssumption(GraphNode node)
    {
        if (!string.Equals(node.NodeType, GraphNodeTypes.Assumption, StringComparison.OrdinalIgnoreCase))
            return false;

        if (string.Equals(node.SourceType, "StructuredBriefAssumption", StringComparison.OrdinalIgnoreCase))
            return true;

        return GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "source", out string? source)
            && string.Equals(source, "structured-brief", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsLinkTarget(GraphNode node) =>
        LinkTargetNodeTypes.Any(type => string.Equals(node.NodeType, type, StringComparison.OrdinalIgnoreCase));

    private static string ReadAssumptionText(GraphNode assumption)
    {
        if (GraphNodePropertyReader.TryGetPropertyValue(assumption.Properties, "assumptionText", out string? text)
            && !string.IsNullOrWhiteSpace(text))
        {
            return text.Trim();
        }

        return assumption.Label?.Trim() ?? string.Empty;
    }

    private static bool AssumptionTextMatchesTarget(
        string assumptionText,
        IReadOnlyList<string> tokens,
        GraphNode target)
    {
        string targetLabel = ResolveTargetLabel(target);

        if (string.IsNullOrWhiteSpace(targetLabel))
            return false;

        string normalizedAssumption = assumptionText.ToLowerInvariant();
        string normalizedTarget = targetLabel.ToLowerInvariant();

        if (normalizedAssumption.Contains(normalizedTarget, StringComparison.Ordinal)
            && normalizedTarget.Length >= MinimumTokenLength)
        {
            return true;
        }

        foreach (string token in tokens)
        {
            if (normalizedTarget.Contains(token, StringComparison.Ordinal))
                return true;
        }

        return false;
    }

    private static string ResolveTargetLabel(GraphNode target)
    {
        if (!string.IsNullOrWhiteSpace(target.Label))
            return target.Label.Trim();

        if (GraphNodePropertyReader.TryGetPropertyValue(target.Properties, "text", out string? text)
            && !string.IsNullOrWhiteSpace(text))
        {
            return text.Trim();
        }

        return target.NodeId;
    }

    private static IReadOnlyList<string> Tokenize(string text)
    {
        List<string> tokens = [];
        string[] parts = text.Split(
            [' ', '|', ',', ';', ':', '.', '(', ')', '[', ']', '{', '}', '/', '\\', '-', '_'],
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (string part in parts)
        {
            string normalized = part.ToLowerInvariant();

            if (normalized.Length < MinimumTokenLength)
                continue;

            if (!tokens.Contains(normalized, StringComparer.Ordinal))
                tokens.Add(normalized);
        }

        return tokens;
    }
}
