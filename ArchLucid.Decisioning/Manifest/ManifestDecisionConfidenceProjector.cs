using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Decisioning.Manifest;

/// <summary>Projects finding-level confidence onto manifest decision rows without silent defaults.</summary>
public static class ManifestDecisionConfidenceProjector
{
    /// <summary>
    ///     Prefers <see cref="Finding.EvaluationConfidenceScore" />, then <see cref="Finding.ConfidenceScore" />; otherwise
    ///     leaves confidence null with <see cref="DecisionConfidenceSource.Unknown" />.
    /// </summary>
    public static (double? Confidence, DecisionConfidenceSource Source) FromFinding(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.EvaluationConfidenceScore is int evaluationScore)
            return (evaluationScore, DecisionConfidenceSource.FindingEvaluation);

        if (finding.ConfidenceScore is double aggregateScore)
            return (aggregateScore, DecisionConfidenceSource.FindingAggregate);

        return (null, DecisionConfidenceSource.Unknown);
    }

    /// <summary>Copies projected confidence fields onto <paramref name="decision" />.</summary>
    public static void ApplyTo(ResolvedArchitectureDecision decision, Finding finding)
    {
        ArgumentNullException.ThrowIfNull(decision);
        ArgumentNullException.ThrowIfNull(finding);

        (double? confidence, DecisionConfidenceSource source) = FromFinding(finding);
        decision.Confidence = confidence;
        decision.ConfidenceSource = source;
    }
}
