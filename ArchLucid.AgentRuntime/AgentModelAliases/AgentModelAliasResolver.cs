using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;

namespace ArchLucid.AgentRuntime.AgentModelAliases;

/// <summary>Fail-closed alias resolution for tier + task pairs (TB-869, TB-2104, TB-2110).</summary>
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
        string? runAlias = RunReviewModelAliasAmbient.TryPeek();

        if (!string.IsNullOrWhiteSpace(runAlias))
        {
            return ResolveForAlias(runAlias, tier, normalizedTask);
        }

        string aliasId = _registry.ResolveAliasIdForTier(tier);

        return ResolveForAlias(aliasId, tier, normalizedTask);
    }

    private AgentModelAliasResolution ResolveForAlias(string aliasId, LlmModelTier tier, string normalizedTask)
    {
        AgentModelAliasRegistryEntry entry = _registry.GetRequired(aliasId);

        if (!entry.IsTaskApproved(normalizedTask))
        {
            throw new AgentModelAliasNotApprovedException(aliasId, normalizedTask);
        }

        AgentModelTaskStructuredOutputMinimum.EnsureSatisfied(aliasId, normalizedTask, entry.StructuredOutputLevel);

        return new AgentModelAliasResolution(aliasId, tier, entry.DeploymentName);
    }
}
