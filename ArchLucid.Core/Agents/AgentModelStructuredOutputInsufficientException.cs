namespace ArchLucid.Core.Agents;

/// <summary>Raised when an engine cannot satisfy a task's structured-output minimum (TB-2104).</summary>
public sealed class AgentModelStructuredOutputInsufficientException : InvalidOperationException
{
    public AgentModelStructuredOutputInsufficientException(
        string aliasId,
        string taskType,
        AgentModelStructuredOutputLevel requiredLevel,
        AgentModelStructuredOutputLevel actualLevel)
        : base(
            $"Model alias '{aliasId}' structured-output level '{actualLevel}' is below the minimum '{requiredLevel}' required for task '{taskType}'.")
    {
        AliasId = aliasId;
        TaskType = taskType;
        RequiredLevel = requiredLevel;
        ActualLevel = actualLevel;
    }

    public string AliasId
    {
        get;
    }

    public string TaskType
    {
        get;
    }

    public AgentModelStructuredOutputLevel RequiredLevel
    {
        get;
    }

    public AgentModelStructuredOutputLevel ActualLevel
    {
        get;
    }
}
