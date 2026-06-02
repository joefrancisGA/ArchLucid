namespace ArchLucid.Core.Persistence;

/// <summary>
///     Raised when a second agent result row is inserted for the same <c>(RunId, TaskId)</c> pair
///     (DB unique index or in-memory guard).
/// </summary>
public sealed class AgentResultDuplicateConflictException : Exception
{
    public AgentResultDuplicateConflictException(string runId, string taskId, Exception? innerException = null)
        : base($"A result for task '{taskId}' has already been submitted for run '{runId}'.", innerException)
    {
        RunId = runId;
        TaskId = taskId;
    }

    public string RunId { get; }

    public string TaskId { get; }
}
