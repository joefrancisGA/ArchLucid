using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;

namespace ArchLucid.AgentRuntime.AgentModelAliases;

/// <summary>Fail-closed alias resolution for tier + task pairs (TB-869).</summary>
public sealed class AgentModelAliasResolver : IAgentModelAliasResolver
{
    private readonly IAgentModelAliasRegistry _registry;

    public AgentModelAliasResolver(IAgentModelAliasRegistry registry)
    {
        _registry = registry ?? throw new ArgumentNullException(nameof(registry));
    }

    public AgentModelAliasResolution Resolve(LlmModelTier tier, string taskType)
    {
        string normalizedTask = AgentModelTaskTypes.FromAgentTypeName(taskType);
        string aliasId = _registry.ResolveAliasIdForTier(tier);
        AgentModelAliasRegistryEntry entry = _registry.GetRequired(aliasId);

        if (!entry.IsTaskApproved(normalizedTask))
        {
            throw new AgentModelAliasNotApprovedException(aliasId, normalizedTask);
        }

        return new AgentModelAliasResolution(aliasId, tier, entry.DeploymentName);
    }
}
