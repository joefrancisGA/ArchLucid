using ArchLucid.Contracts.Common;

namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Semantic scoring for persisted agent JSON — deterministic heuristic plus optional Azure OpenAI rubric judge.
/// </summary>
public interface IAgentOutputSemanticEvaluator
{
    Task<AgentOutputSemanticScore> EvaluateAsync(
        string traceId,
        string? parsedResultJson,
        AgentType agentType,
        CancellationToken cancellationToken = default);
}
