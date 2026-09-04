using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Findings;

public static partial class ExplainabilityTraceCompletenessAnalyzer
{
    /// <summary>Aggregates scores for all findings in the snapshot, grouped by <see cref="Finding.EngineType" />.</summary>
    public static TraceCompletenessSummary AnalyzeSnapshot(FindingsSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        List<Finding> findings = snapshot.Findings;

        if (findings.Count == 0)
            return new TraceCompletenessSummary { TotalFindings = 0, OverallCompletenessRatio = 0.0, ByEngine = [] };

        List<TraceCompletenessScore> scores = findings.Select(AnalyzeFinding).ToList();

        double overall = scores.Average(s => s.CompletenessRatio);

        List<EngineTraceCompleteness> byEngine = scores
            .GroupBy(s => s.EngineType, StringComparer.OrdinalIgnoreCase)
            .OrderBy(g => g.Key, StringComparer.OrdinalIgnoreCase)
            .Select(g =>
            {
                List<TraceCompletenessScore> list = g.ToList();

                return new EngineTraceCompleteness
                {
                    EngineType = g.Key,
                    FindingCount = list.Count,
                    CompletenessRatio = list.Average(x => x.CompletenessRatio),
                    GraphNodeIdsPopulatedCount = list.Count(x => x.HasGraphNodeIds),
                    RulesAppliedPopulatedCount = list.Count(x => x.HasRulesApplied),
                    DecisionsTakenPopulatedCount = list.Count(x => x.HasDecisionsTaken),
                    AlternativePathsPopulatedCount = list.Count(x => x.HasAlternativePaths),
                    NotesPopulatedCount = list.Count(x => x.HasNotes),
                    CitationsPopulatedCount = list.Count(x => x.HasCitations)
                };
            })
            .ToList();

        return new TraceCompletenessSummary { TotalFindings = findings.Count, OverallCompletenessRatio = overall, ByEngine = byEngine };
    }
}
