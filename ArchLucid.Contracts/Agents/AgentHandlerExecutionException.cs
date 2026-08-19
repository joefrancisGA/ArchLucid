using ArchLucid.Contracts.Common;

namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Wraps a handler failure with the agent dispatch key and enum so orchestration can surface stable summaries
///     without scraping exception messages (which may contain LLM text).
/// </summary>
public sealed class AgentHandlerExecutionException : Exception
{
    public AgentHandlerExecutionException(string agentTypeKey, AgentType agentType, Exception innerException)
        : base("Agent handler execution failed.", innerException)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(agentTypeKey);
        AgentTypeKey = agentTypeKey;
        AgentType = agentType;
    }

    public string AgentTypeKey { get; }

    public AgentType AgentType { get; }
}
