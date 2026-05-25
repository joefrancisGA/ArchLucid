using ArchLucid.Application.Explanation.Models;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Application.Explanation;

public sealed class FindingExplainabilityComposer : IFindingExplainabilityComposer
{
    public FindingExplainabilityResult Compose(Finding match)
    {
        ArgumentNullException.ThrowIfNull(match);

        TraceCompletenessScore score = ExplainabilityTraceCompletenessAnalyzer.AnalyzeFinding(match);
        ExplainabilityTrace t = match.Trace;
        FindingExplainabilityEvidence evidence =
            FindingExplainabilityEvidenceMapper.ToModel(FindingExplainabilityNarrativeBuilder.BuildEvidence(match));

        return new FindingExplainabilityResult
        {
            FindingId = match.FindingId,
            Title = match.Title,
            EngineType = match.EngineType,
            Severity = match.Severity.ToString(),
            TraceCompletenessRatio = score.CompletenessRatio,
            MissingTraceFields = [.. score.MissingTraceFields],
            GraphNodeIdsExamined = t.GraphNodeIdsExamined,
            RulesApplied = t.RulesApplied,
            DecisionsTaken = t.DecisionsTaken,
            AlternativePathsConsidered = t.AlternativePathsConsidered,
            Notes = t.Notes,
            Evidence = evidence,
            NarrativeText = FindingExplainabilityNarrativeBuilder.Build(
                match.FindingId,
                match.Title,
                match.EngineType,
                t,
                score.CompletenessRatio),
            EvaluationConfidenceScore = match.EvaluationConfidenceScore,
            ConfidenceLevel = match.ConfidenceLevel,
        };
    }
}
