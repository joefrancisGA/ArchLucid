using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime.Prompts.Variants;

/// <summary>Maps <see cref="AgentType" /> to built-in prompt template ids.</summary>
public static class PromptTemplateNameResolver
{
    public static string FromAgentType(AgentType agentType)
    {
        return agentType switch
        {
            AgentType.Topology => TopologySystemPromptTemplate.TemplateId,
            AgentType.Compliance => ComplianceSystemPromptTemplate.TemplateId,
            AgentType.Cost => CostSystemPromptTemplate.TemplateId,
            AgentType.Critic => CriticSystemPromptTemplate.TemplateId,
            _ => throw new InvalidOperationException($"Agent type '{agentType}' has no prompt template mapping.")
        };
    }
}
