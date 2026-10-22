using ArchLucid.Contracts.Common;

namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Deterministic claim/finding completeness scoring over persisted agent JSON (no LLM). Used for fast paths and
///     reference fixtures.
/// </summary>
public interface IHeuristicAgentOutputSemanticEvaluator
{
    AgentOutputSemanticScore Evaluate(string traceId, string? parsedResultJson, AgentType agentType);
}
