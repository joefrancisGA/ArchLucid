using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.AgentEvaluation;

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
