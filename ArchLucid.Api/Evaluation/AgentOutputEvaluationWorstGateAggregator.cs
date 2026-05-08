using ArchLucid.Contracts.Agents;

namespace ArchLucid.Api.Evaluation;

/// <summary>
///     Rollup helper for on-demand run agent-evaluation responses: picks the worst gate outcome across traces without
///     changing persistence.
/// </summary>
internal static class AgentOutputEvaluationWorstGateAggregator
{
    public static AgentOutputQualityGateOutcome? WorstOutcome(
        IReadOnlyList<AgentOutputEvaluationScore> scores,
        IAgentOutputQualityGate gate)
    {
        ArgumentNullException.ThrowIfNull(scores);
        ArgumentNullException.ThrowIfNull(gate);

        AgentOutputQualityGateOutcome? worst = null;

        foreach (AgentOutputEvaluationScore score in scores)
        {
            if (score.IsJsonParseFailure || score.Semantic is null)
                continue;

            AgentOutputQualityGateOutcome o = gate.Evaluate(score, score.Semantic);
            worst = worst is null ? o : PickWorse(worst.Value, o);
        }

        return worst;
    }

    private static AgentOutputQualityGateOutcome PickWorse(AgentOutputQualityGateOutcome a, AgentOutputQualityGateOutcome b)
    {
        int Rank(AgentOutputQualityGateOutcome x) => x switch
        {
            AgentOutputQualityGateOutcome.Rejected => 2,
            AgentOutputQualityGateOutcome.Warned => 1,
            _ => 0,
        };

        return Rank(a) >= Rank(b) ? a : b;
    }
}
