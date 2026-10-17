using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.KnowledgeGraph;
namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>Builds mode-aware completeness summaries for inventory diagram render (IDX-11).</summary>
public static class InfraEvidenceMermaidCompletenessSummaryBuilder
{
    public static InfraEvidenceMermaidCompletenessSummary? Build(
        string modeKey,
        DiagramAst? ast,
        IReadOnlyList<string> snapshotWarnings)
    {
        if (ast is null)
        {
            return null;
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(modeKey);
        ArgumentNullException.ThrowIfNull(snapshotWarnings);

        List<DiagramEdge> visibleEdges = ast.Edges
            .Where(edge => !edge.IsLayoutOnly)
            .ToList();
        HashSet<string> collectedClasses = visibleEdges
            .Select(edge => edge.InferenceSource ?? edge.Label)
            .Where(source => !string.IsNullOrWhiteSpace(source))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        int hiddenHopCount = ast.Edges.Count(IsHiddenHopEdge);
        int collocationCount = ast.Edges.Count(IsLikelyInCollocationEdge);

        return new InfraEvidenceMermaidCompletenessSummary
        {
            Mode = modeKey,
            VisibleNodeCount = ast.Nodes.Count,
            VisibleEdgeCount = visibleEdges.Count,
            ConnectedComponentCount = DiagramAstVisibleComponentCounter.Count(ast),
            HiddenHopsUsedCount = hiddenHopCount,
            LikelyInCollocationEdgeCount = collocationCount,
            CollectedClasses = collectedClasses.Order(StringComparer.Ordinal).ToList(),
            MissingClasses = ResolveMissingClasses(modeKey, snapshotWarnings),
        };
    }

    private static List<string> ResolveMissingClasses(string modeKey, IReadOnlyList<string> snapshotWarnings)
    {
        HashSet<string> missing = new(StringComparer.OrdinalIgnoreCase);

        foreach (string warning in snapshotWarnings)
        {
            if (!InfraEvidenceMermaidCompletenessRelationshipClassCatalog.WarningAppliesToMode(modeKey, warning))
            {
                continue;
            }

            string? label = InfraEvidenceMermaidCompletenessRelationshipClassCatalog.ResolveClassLabel(warning);

            if (!string.IsNullOrWhiteSpace(label))
            {
                missing.Add(label);
                continue;
            }

            if (warning.Contains("missing", StringComparison.OrdinalIgnoreCase))
            {
                missing.Add(warning);
            }
        }

        foreach (string legacy in InfraEvidenceMermaidCompletenessModeFilter.FilterMissingWarnings(modeKey, snapshotWarnings))
        {
            missing.Add(legacy);
        }

        return missing.Order(StringComparer.Ordinal).ToList();
    }

    private static bool IsHiddenHopEdge(DiagramEdge edge)
    {
        if (edge.InferenceSource is null)
        {
            return false;
        }

        return edge.InferenceSource.Equals(GraphEdgeInferenceSources.InventoryNicSubnet, StringComparison.OrdinalIgnoreCase)
               || edge.InferenceSource.Equals(GraphEdgeInferenceSources.InventoryPeSubnet, StringComparison.OrdinalIgnoreCase)
               || edge.InferenceSource.Equals(GraphEdgeInferenceSources.InventoryPrivateEndpoint, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsLikelyInCollocationEdge(DiagramEdge edge)
    {
        if (edge.IsLayoutOnly)
        {
            return false;
        }

        return string.Equals(
                   edge.InferenceSource,
                   GraphEdgeInferenceSources.InventoryResourceGroupCollocation,
                   StringComparison.OrdinalIgnoreCase)
               || (edge.Label ?? string.Empty).Contains("likely", StringComparison.OrdinalIgnoreCase)
                  && (edge.Label ?? string.Empty).Contains("in", StringComparison.OrdinalIgnoreCase);
    }
}
