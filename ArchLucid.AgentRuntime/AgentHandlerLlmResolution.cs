using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime;

/// <summary>Resolves primary and economy-tier clients for agent handler LLM calls.</summary>
public static class AgentHandlerLlmResolution
{
    /// <summary>
    ///     Primary client follows agent/task tier mapping; remediation client uses the configured economy tier for
    ///     schema-repair retries.
    /// </summary>
    public static (IAgentCompletionClient Primary, IAgentCompletionClient Remediation) ResolveCompletionClients(
        IAgentTierCompletionRouter tierRouter,
        AgentType agentType,
        AgentTask task)
    {
        ArgumentNullException.ThrowIfNull(tierRouter);
        ArgumentNullException.ThrowIfNull(task);

        (IAgentCompletionClient primary, _) = tierRouter.ResolveForAgent(agentType, task.ModelTierOverride);
        (IAgentCompletionClient remediation, _) = tierRouter.ResolveForAgent(agentType, LlmModelTier.Economy);

        return (primary, remediation);
    }
}
