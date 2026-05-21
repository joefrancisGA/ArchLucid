namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Classifies structural + semantic evaluation scores for operator metrics. Does not throw and does not mutate stored
///     traces.
/// </summary>
public interface IAgentOutputQualityGate
{
    /// <summary>Maps scores to <see cref="AgentOutputQualityGateOutcome" /> using configured thresholds.</summary>
    /// <param name="calibratedConfidence">
    ///     When set, used in place of <paramref name="semanticScore" />.<see cref="AgentOutputSemanticScore.OverallSemanticScore" />
    ///     for semantic warn/reject floor comparisons.
    /// </param>
    AgentOutputQualityGateOutcome Evaluate(
        AgentOutputEvaluationScore structuralScore,
        AgentOutputSemanticScore semanticScore,
        double? calibratedConfidence = null);
}
