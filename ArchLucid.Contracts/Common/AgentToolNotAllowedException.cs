namespace ArchLucid.Contracts.Common;

/// <summary>Thrown when <see cref="Agents.AgentTask.AllowedTools" /> blocks handler dispatch (TB-082).</summary>
public sealed class AgentToolNotAllowedException : Exception
{
    public AgentToolNotAllowedException(string taskId, string dispatchKey, ICollection<string> allowedTools)
        : base(
            $"Agent task '{taskId}' is not allowed to dispatch handler '{dispatchKey}'. "
            + $"AllowedTools: [{string.Join(", ", allowedTools)}].")
    {
        TaskId = taskId;
        DispatchKey = dispatchKey;
    }

    public string TaskId
    {
        get;
    }

    public string DispatchKey
    {
        get;
    }
}
