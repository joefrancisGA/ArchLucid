using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime;

/// <summary>Resolves primary and schema-remediation clients for agent handler LLM calls.</summary>
public static class AgentHandlerLlmResolution
{
    /// <summary>
    ///     Primary client follows agent/task tier mapping; remediation client is the dedicated non-Polly stack
    ///     (<see cref="ISchemaRemediationAgentCompletionClient" />).
    /// </summary>
    public static (IAgentCompletionClient Primary, IAgentCompletionClient Remediation) ResolveCompletionClients(
        IAgentTierCompletionRouter tierRouter,
        ISchemaRemediationAgentCompletionClient schemaRemediationClient,
        AgentType agentType,
        AgentTask task)
    {
        ArgumentNullException.ThrowIfNull(tierRouter);
        ArgumentNullException.ThrowIfNull(schemaRemediationClient);
        ArgumentNullException.ThrowIfNull(task);

        (IAgentCompletionClient primary, _) = tierRouter.ResolveForAgent(agentType, task.ModelTierOverride);

        return (primary, schemaRemediationClient);
    }
}
