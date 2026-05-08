using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <inheritdoc cref="IAgentOutputSemanticEvaluator" />
public sealed class CompositeAgentOutputSemanticEvaluator(
    IHeuristicAgentOutputSemanticEvaluator heuristic,
    AgentOutputLlmSemanticJudge judge) : IAgentOutputSemanticEvaluator
{
    private readonly IHeuristicAgentOutputSemanticEvaluator _heuristic =
        heuristic ?? throw new ArgumentNullException(nameof(heuristic));

    private readonly AgentOutputLlmSemanticJudge _judge = judge ?? throw new ArgumentNullException(nameof(judge));

    /// <inheritdoc />
    public async Task<AgentOutputSemanticScore> EvaluateAsync(
        string traceId,
        string? parsedResultJson,
        AgentType agentType,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);

        AgentOutputSemanticScore heuristicScore = _heuristic.Evaluate(traceId, parsedResultJson, agentType);

        double ho = heuristicScore.HeuristicOverallScore;

        if (string.IsNullOrWhiteSpace(parsedResultJson))
            return heuristicScore;

        AgentOutputLlmJudgeParsedResult? judged =
            await _judge.TryJudgeAsync(traceId, parsedResultJson, agentType, cancellationToken)
                .ConfigureAwait(false);

        if (judged is null)
        {
            heuristicScore.OverallSemanticScore = ho;

            return heuristicScore;
        }

        heuristicScore.LlmJudgeOverallQuality = judged.OverallQuality;

        heuristicScore.LlmJudgeNotes = judged.Rationale;

        heuristicScore.OverallSemanticScore = judged.OverallQuality;

        return heuristicScore;
    }
}
