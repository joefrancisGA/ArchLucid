using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Agents;

/// <summary>Maps execution profiles to model tiers for starter agent tasks (TB-870).</summary>
public static class AgentModelExecutionProfileTierPolicy
{
    public static LlmModelTier ResolveTier(AgentModelExecutionProfile profile, AgentType agentType)
    {
        if (profile == AgentModelExecutionProfile.Economy)
        {
            return LlmModelTier.Economy;
        }

        if (profile == AgentModelExecutionProfile.HighAssurance)
        {
            return LlmModelTier.Premium;
        }

        // Balanced profile: Luna for bulk extractors, Terra for policy, Sol for hard critique.
        return agentType switch
        {
            AgentType.Compliance => LlmModelTier.Standard,
            AgentType.Critic => LlmModelTier.Premium,
            _ => LlmModelTier.Economy
        };
    }
}
