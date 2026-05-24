using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.AgentEvaluation;

/// <summary>
///     Pure structural checks on persisted agent execution trace JSON; no LLM.
/// </summary>
public interface IAgentOutputEvaluator
{
    /// <summary>
    ///     Scores presence of expected top-level JSON properties for <paramref name="agentType" /> (camelCase keys as stored
    ///     in traces).
    /// </summary>
    AgentOutputEvaluationScore Evaluate(string traceId, string? parsedResultJson, AgentType agentType);
}
