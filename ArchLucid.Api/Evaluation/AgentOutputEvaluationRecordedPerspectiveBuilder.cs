using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.Api.Evaluation;

/// <summary>Builds authoritative recorded perspectives from persisted trace snapshots (TB-973).</summary>
internal static class AgentOutputEvaluationRecordedPerspectiveBuilder
{
    public static AgentOutputEvaluationPerspective? TryBuild(
        IReadOnlyList<AgentExecutionTrace> traces,
        IReadOnlyList<AgentOutputEvaluationScore> advisoryScores,
        int tracesSkippedCount)
    {
        ArgumentNullException.ThrowIfNull(traces);
        ArgumentNullException.ThrowIfNull(advisoryScores);

        if (!traces.Any(static t => t.RecordedQualityGateOutcome is not null))
            return null;

        Dictionary<string, AgentOutputEvaluationScore> advisoryByTraceId =
            advisoryScores.ToDictionary(static s => s.TraceId, StringComparer.Ordinal);

        List<AgentOutputEvaluationScore> recordedScores = [];

        foreach (AgentExecutionTrace trace in traces)
        {
            if (!advisoryByTraceId.TryGetValue(trace.TraceId, out AgentOutputEvaluationScore? advisoryScore))
                continue;

            if (trace.RecordedQualityGateOutcome is null)
                continue;

            recordedScores.Add(CloneWithRecordedOutcome(advisoryScore, trace));
        }

        AgentExecutionTrace? definitionTrace = traces
            .Where(static t => !string.IsNullOrWhiteSpace(t.QualityGateDefinitionContentHashSha256))
            .OrderByDescending(static t => t.CreatedUtc)
            .FirstOrDefault();

        QualityGateDefinitionSnapshotDto? gateDefinition = definitionTrace is null
            ? null
            : new QualityGateDefinitionSnapshotDto
            {
                DefinitionVersion = definitionTrace.QualityGateDefinitionVersion
                    ?? $"config-{definitionTrace.QualityGateDefinitionContentHashSha256![..12]}",
                ContentHashSha256 = definitionTrace.QualityGateDefinitionContentHashSha256!,
                Mode = definitionTrace.QualityGateDefinitionMode ?? "WarnOnly",
                EffectiveFromUtc = definitionTrace.CreatedUtc,
            };

        return AgentOutputEvaluationPerspectiveMapper.Build(
            AgentOutputEvaluationPerspectiveMapper.RecordedAuthority,
            recordedScores,
            tracesSkippedCount,
            gateDefinition);
    }

    public static AgentOutputQualityGateOutcome? WorstRecordedOutcome(IReadOnlyList<AgentOutputEvaluationScore> scores)
    {
        AgentOutputQualityGateOutcome? worst = null;

        foreach (AgentOutputEvaluationScore score in scores)
        {
            if (score.QualityGateOutcome is not { } outcome)
                continue;

            worst = worst is null ? outcome : PickWorse(worst.Value, outcome);
        }

        return worst;
    }

    private static AgentOutputEvaluationScore CloneWithRecordedOutcome(
        AgentOutputEvaluationScore advisoryScore,
        AgentExecutionTrace trace)
    {
        double structuralRatio = trace.RecordedStructuralCompletenessRatio
            ?? advisoryScore.StructuralCompletenessRatio;

        AgentOutputSemanticScore? semantic = advisoryScore.Semantic;

        if (trace.RecordedSemanticScore is { } recordedSemantic && semantic is not null)
        {
            semantic = new AgentOutputSemanticScore
            {
                OverallSemanticScore = recordedSemantic,
                EmptyClaimCount = semantic.EmptyClaimCount,
                IncompleteFindingCount = semantic.IncompleteFindingCount,
                FindingCitationCoverageRatio = semantic.FindingCitationCoverageRatio,
                LlmJudgeHeuristicDisagreement = semantic.LlmJudgeHeuristicDisagreement,
                AgentResultEmbeddingFaithfulnessMeanCosine = semantic.AgentResultEmbeddingFaithfulnessMeanCosine,
                LlmFaithfulnessScore = semantic.LlmFaithfulnessScore,
            };
        }

        return new AgentOutputEvaluationScore
        {
            TraceId = advisoryScore.TraceId,
            AgentType = advisoryScore.AgentType,
            StructuralCompletenessRatio = structuralRatio,
            IsJsonParseFailure = advisoryScore.IsJsonParseFailure,
            MissingKeys = advisoryScore.MissingKeys,
            Semantic = semantic,
            BlobUploadFailed = advisoryScore.BlobUploadFailed,
            QualityWarning = trace.QualityWarning,
            QualityGateOutcome = trace.RecordedQualityGateOutcome,
            QualityGateDefinitionContentHashSha256 = trace.QualityGateDefinitionContentHashSha256,
            RecordedRejectReasonCategory = trace.RecordedRejectReasonCategory,
            RecordedTriageScenarioId = trace.RecordedTriageScenarioId,
        };
    }

    private static AgentOutputQualityGateOutcome PickWorse(
        AgentOutputQualityGateOutcome a,
        AgentOutputQualityGateOutcome b)
    {
        return Rank(a) >= Rank(b) ? a : b;

        static int Rank(AgentOutputQualityGateOutcome x) => x switch
        {
            AgentOutputQualityGateOutcome.Rejected => 2,
            AgentOutputQualityGateOutcome.Warned => 1,
            _ => 0,
        };
    }
}
