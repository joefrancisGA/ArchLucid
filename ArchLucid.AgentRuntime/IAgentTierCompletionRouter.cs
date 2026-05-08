using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Selects an <see cref="IAgentCompletionClient" /> for an agent call based on model tier resolution rules.
/// </summary>
public interface IAgentTierCompletionRouter
{
    /// <summary>
    ///     Resolves tier and returns the completion client for that tier (memoized per DI scope). Non-agent surfaces
    ///     use <see cref="DefaultCompletionClient" /> (default tenant tier).
    /// </summary>
    (IAgentCompletionClient Client, LlmModelTier ResolvedTier) ResolveForAgent(
        AgentType agentType,
        LlmModelTier? taskTierOverride);

    /// <summary>Client for Ask, explanations, and telemetry default (default tenant tier).</summary>
    IAgentCompletionClient DefaultCompletionClient
    {
        get;
    }
}
