using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Async façade over <see cref="IHeuristicAgentOutputSemanticEvaluator" /> for deterministic fast paths without a second
///     LLM judge call (confidence enrichment, snapshots).
/// </summary>
public sealed class HeuristicOnlyAgentOutputSemanticEvaluator(IHeuristicAgentOutputSemanticEvaluator heuristic) : IAgentOutputSemanticEvaluator
{
    private readonly IHeuristicAgentOutputSemanticEvaluator _heuristic = heuristic ?? throw new ArgumentNullException(nameof(heuristic));

    /// <inheritdoc />
    public Task<AgentOutputSemanticScore> EvaluateAsync(
        string traceId,
        string? parsedResultJson,
        AgentType agentType,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);
        _ = cancellationToken;

        return Task.FromResult(_heuristic.Evaluate(traceId, parsedResultJson, agentType));
    }
}
