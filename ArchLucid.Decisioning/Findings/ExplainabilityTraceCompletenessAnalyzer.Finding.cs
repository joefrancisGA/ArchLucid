using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Findings;

public static partial class ExplainabilityTraceCompletenessAnalyzer
{
    /// <summary>Analyzes a single finding's trace; treats null <see cref="Finding.Trace" /> as empty.</summary>
    public static TraceCompletenessScore AnalyzeFinding(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        // Trace is typed non-null on Finding, but object initializers, tests (Trace = null!), and some payloads leave it null at runtime.

        ExplainabilityTrace? trace = finding.Trace;

        if (trace is null)
            return TraceCompletenessScoreForMissingTrace(finding);

        bool hasGraph = ListHasMeaningfulContent(trace.GraphNodeIdsExamined);
        bool hasRules = ListHasMeaningfulContent(trace.RulesApplied);
        bool hasDecisions = ListHasMeaningfulContent(trace.DecisionsTaken);
        bool hasAlt = ListHasMeaningfulAlternativePaths(trace.AlternativePathsConsidered);
        bool hasNotes = ListHasMeaningfulContent(trace.Notes);
        bool hasCitations = ListHasMeaningfulContent(trace.Citations);
        bool hasReasoning = !string.IsNullOrWhiteSpace(trace.ReasoningTrace)
                            || !string.IsNullOrWhiteSpace(trace.ReasoningTraceDigestSha256);

        int populated = 0;

        if (hasGraph)
            populated++;
        if (hasRules)
            populated++;
        if (hasDecisions)
            populated++;
        if (hasAlt)
            populated++;
        if (hasNotes)
            populated++;
        if (hasCitations)
            populated++;
        if (hasReasoning)
            populated++;

        List<string> missing = [];

        if (!hasGraph)
            missing.Add("Graph nodes examined");

        if (!hasRules)
            missing.Add("Rules applied");

        if (!hasDecisions)
            missing.Add("Decisions taken");

        if (!hasAlt)
            missing.Add("Alternative paths considered");

        if (!hasNotes)
            missing.Add("Notes");

        if (!hasCitations)
            missing.Add("Citations");

        if (!hasReasoning)
            missing.Add("Reasoning trace");

        return new TraceCompletenessScore
        {
            FindingId = finding.FindingId,
            EngineType = finding.EngineType,
            HasGraphNodeIds = hasGraph,
            HasRulesApplied = hasRules,
            HasDecisionsTaken = hasDecisions,
            HasAlternativePaths = hasAlt,
            HasNotes = hasNotes,
            HasCitations = hasCitations,
            PopulatedFieldCount = populated,
            CompletenessRatio = populated / 7.0,
            MissingTraceFields = missing,
        };
    }
}
