using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
/// Composes structural + semantic evaluators with finding/category expectations for offline and test-time agent output checks.
/// </summary>
public interface IAgentOutputEvaluationHarness
{
    /// <summary>
    /// Serializes <paramref name="actual"/> with web JSON naming, runs structural + semantic scoring, then applies <paramref name="expected"/> rules.
    /// </summary>
    AgentOutputHarnessResult Evaluate(AgentType agentType, AgentResult actual, AgentOutputExpectation expected);
}
