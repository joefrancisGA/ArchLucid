namespace ArchLucid.Core.Agents;

/// <summary>Minimum structured-output level per task type (TB-2104).</summary>
public static class AgentModelTaskStructuredOutputMinimum
{
    public static AgentModelStructuredOutputLevel ResolveMinimum(string taskType)
    {
        string normalized = AgentModelTaskTypes.FromAgentTypeName(taskType);

        if (string.Equals(normalized, AgentModelTaskTypes.SchemaRemediation, StringComparison.OrdinalIgnoreCase))
        {
            return AgentModelStructuredOutputLevel.StrictJsonSchema;
        }

        if (string.Equals(normalized, AgentModelTaskTypes.FromAgentType(Contracts.Common.AgentType.Topology), StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, AgentModelTaskTypes.FromAgentType(Contracts.Common.AgentType.Cost), StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, AgentModelTaskTypes.FromAgentType(Contracts.Common.AgentType.Compliance), StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, AgentModelTaskTypes.FromAgentType(Contracts.Common.AgentType.Critic), StringComparison.OrdinalIgnoreCase))
        {
            return AgentModelStructuredOutputLevel.StrictJsonSchema;
        }

        return AgentModelStructuredOutputLevel.JsonObject;
    }

    public static void EnsureSatisfied(
        string aliasId,
        string taskType,
        AgentModelStructuredOutputLevel engineLevel)
    {
        AgentModelStructuredOutputLevel required = ResolveMinimum(taskType);

        if (engineLevel < required)
        {
            throw new AgentModelStructuredOutputInsufficientException(aliasId, taskType, required, engineLevel);
        }
    }
}
