using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
/// Maps canonical <see cref="GraphEdgeTypes" /> values to short diagram labels shown on connectors.
/// </summary>
internal static class DiagramEdgeLabelHumanizer
{
    public static void ApplyToVisibleEdges(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        foreach (DiagramEdge edge in ast.Edges)
        {
            if (edge.IsLayoutOnly)
            {
                continue;
            }

            edge.Label = HumanizeLabel(edge.Label);
        }
    }

    public static string ResolveDisplayLabel(string? storedLabel, string edgeType)
    {
        string candidate = string.IsNullOrWhiteSpace(storedLabel) ? edgeType : storedLabel.Trim();

        return HumanizeLabel(candidate);
    }

    public static string HumanizeLabel(string? label)
    {
        if (string.IsNullOrWhiteSpace(label))
        {
            return string.Empty;
        }

        string trimmed = label.Trim();

        if (TryHumanizeGraphEdgeType(trimmed, out string humanized))
        {
            return humanized;
        }

        return trimmed;
    }

    private static bool TryHumanizeGraphEdgeType(string value, out string humanized)
    {
        if (string.Equals(value, GraphEdgeTypes.PeersWith, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "peering";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.ConnectsTo, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "connects";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.Contains, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, GraphEdgeTypes.ContainsResource, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "contains";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.Protects, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "protects";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.AppliesTo, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "applies to";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.RelatesTo, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "relates to";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.DependsOn, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "depends on";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.Exposes, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "exposes";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.HasRole, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "has role";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.UsesIdentity, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "uses identity";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.CanRead, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "can read";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.CanWrite, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "can write";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.CanAssume, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "can assume";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.RoutesTo, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "routes to";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.FederatesAs, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "federates as";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.MemberOf, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "member of";

            return true;
        }

        humanized = string.Empty;

        return false;
    }
}
