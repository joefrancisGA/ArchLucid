using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime;

/// <summary>Resolves model tier and Azure deployment for agent LLM calls from configuration.</summary>
public interface IAgentModelTierResolver
{
    /// <summary>Effective tier: task override, then per-agent mapping, then tenant default.</summary>
    LlmModelTier ResolveTierForAgent(AgentType agentType, LlmModelTier? taskTierOverride);

    /// <summary>Configured default tier for non-agent completion paths (Ask, explanations).</summary>
    LlmModelTier ResolveDefaultTenantTier();

    /// <summary>Deployment name for <paramref name="tier" /> (never empty when base deployment is configured).</summary>
    string ResolveDeploymentName(LlmModelTier tier);
}
