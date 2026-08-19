namespace ArchLucid.Core.Agents;

/// <summary>Thrown when a task type is not approved for the resolved alias (TB-869 fail-closed gate).</summary>
public sealed class AgentModelAliasNotApprovedException : InvalidOperationException
{
    public AgentModelAliasNotApprovedException(string aliasId, string taskType)
        : base($"Model alias '{aliasId}' is not approved for task '{taskType}'.")
    {
        AliasId = aliasId;
        TaskType = taskType;
    }

    public string AliasId
    {
        get;
    }

    public string TaskType
    {
        get;
    }
}
