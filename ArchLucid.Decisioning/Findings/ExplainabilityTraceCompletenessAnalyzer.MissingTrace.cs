using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Findings;

public static partial class ExplainabilityTraceCompletenessAnalyzer
{
    private static TraceCompletenessScore TraceCompletenessScoreForMissingTrace(Finding finding)
    {
        List<string> missing =
        [
            "Graph nodes examined",
            "Rules applied",
            "Decisions taken",
            "Alternative paths considered",
            "Notes",
            "Citations",
            "Reasoning trace",
        ];

        return new TraceCompletenessScore
        {
            FindingId = finding.FindingId,
            EngineType = finding.EngineType,
            HasGraphNodeIds = false,
            HasRulesApplied = false,
            HasDecisionsTaken = false,
            HasAlternativePaths = false,
            HasNotes = false,
            HasCitations = false,
            PopulatedFieldCount = 0,
            CompletenessRatio = 0.0,
            MissingTraceFields = missing,
        };
    }

    private static bool ListHasMeaningfulContent(IReadOnlyList<string>? list)
    {
        if (list is null || list.Count == 0)
            return false;

        return list.Any(s => !string.IsNullOrWhiteSpace(s));
    }

    /// <summary>
    ///     Ignores the deterministic single-path sentinel so completeness is not inflated when no real alternatives were explored.
    /// </summary>
    private static bool ListHasMeaningfulAlternativePaths(IReadOnlyList<string>? list)
    {
        if (list is null || list.Count == 0)
            return false;

        return list.Any(s =>
            !string.IsNullOrWhiteSpace(s)
            && !string.Equals(s, ExplainabilityTraceMarkers.RuleBasedDeterministicSinglePathNote, StringComparison.Ordinal));
    }
}
