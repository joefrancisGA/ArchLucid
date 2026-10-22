using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.QualityGates;

namespace ArchLucid.Api.Evaluation;

internal static class AgentOutputEvaluationPerspectiveMapper
{
    public const string RecordedAuthority = "recorded";
    public const string AdvisoryCurrentAuthority = "advisoryCurrent";

    public static QualityGateDefinitionSnapshotDto ToDto(QualityGateDefinitionSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        return new QualityGateDefinitionSnapshotDto
        {
            DefinitionVersion = snapshot.DefinitionVersion,
            ContentHashSha256 = snapshot.ContentHashSha256,
            Mode = snapshot.Mode.ToString(),
            EffectiveFromUtc = snapshot.EffectiveFromUtc,
            DeprecatedReason = snapshot.DeprecatedReason,
        };
    }

    public static AgentOutputEvaluationPerspective Build(
        string authority,
        IReadOnlyList<AgentOutputEvaluationScore> scores,
        int tracesSkippedCount,
        QualityGateDefinitionSnapshotDto? gateDefinition,
        Func<IReadOnlyList<AgentOutputEvaluationScore>, AgentOutputQualityGateOutcome?>? aggregateResolver = null)
    {
        IEnumerable<double> ratiosForAverage =
            scores.Where(static s => !s.IsJsonParseFailure).Select(static s => s.StructuralCompletenessRatio);

        IEnumerable<double> semanticForAverage =
            scores.Where(static s => s is { IsJsonParseFailure: false, Semantic: not null })
                .Select(static s => s.Semantic!.OverallSemanticScore);

        double[] ratioArray = ratiosForAverage.ToArray();
        double[] semanticArray = semanticForAverage.ToArray();

        AgentOutputQualityGateOutcome? aggregate = aggregateResolver?.Invoke(scores)
            ?? AgentOutputEvaluationRecordedPerspectiveBuilder.WorstRecordedOutcome(scores);

        return new AgentOutputEvaluationPerspective
        {
            Authority = authority,
            GateDefinition = gateDefinition,
            Scores = scores,
            TracesSkippedCount = tracesSkippedCount,
            AverageStructuralCompletenessRatio = ratioArray.Length == 0 ? null : ratioArray.Average(),
            AverageSemanticScore = semanticArray.Length == 0 ? null : semanticArray.Average(),
            AggregateQualityGateOutcome = aggregate,
        };
    }
}
