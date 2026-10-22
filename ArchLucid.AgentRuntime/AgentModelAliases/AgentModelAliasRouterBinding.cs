using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;

namespace ArchLucid.AgentRuntime.AgentModelAliases;

/// <summary>Binds alias ambient state when a tier router resolves a client (TB-869).</summary>
public static class AgentModelAliasRouterBinding
{
    public static void BindAlias(IAgentModelAliasResolver? aliasResolver, LlmModelTier tier, string taskType)
    {
        if (aliasResolver is null)
        {
            return;
        }

        AgentModelAliasResolution resolution = aliasResolver.Resolve(tier, taskType);
        AgentModelAliasInvocationAmbient.Set(resolution.AliasId);
    }
}
