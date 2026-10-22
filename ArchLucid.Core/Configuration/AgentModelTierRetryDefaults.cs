using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Configuration;

/// <summary>
///     TB-179 default tiers used when resolving quality-gate retry escalation without full DI config.
/// </summary>
public static class AgentModelTierRetryDefaults
{
    /// <summary>Built-in default tier for an agent type when the task has no override.</summary>
    public static LlmModelTier DefaultTierForAgent(AgentType agentType) =>
        agentType switch
        {
            AgentType.Topology => LlmModelTier.Economy,
            AgentType.Cost => LlmModelTier.Economy,
            AgentType.Compliance => LlmModelTier.Standard,
            AgentType.Critic => LlmModelTier.Premium,
            _ => LlmModelTier.Standard,
        };
}
