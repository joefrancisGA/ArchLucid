using ArchLucid.Contracts.Agents;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Classifies structural + semantic evaluation scores for operator metrics. Does not throw and does not mutate stored
///     traces.
/// </summary>
public interface IAgentOutputQualityGate
{
    /// <summary>Maps scores to <see cref="AgentOutputQualityGateOutcome" /> using configured thresholds.</summary>
    AgentOutputQualityGateOutcome Evaluate(
        AgentOutputEvaluationScore structuralScore,
        AgentOutputSemanticScore semanticScore);
}
