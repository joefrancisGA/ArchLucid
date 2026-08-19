namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Wraps an unexpected agent-batch failure so logs include <see cref="RunId" /> and a stable task correlation string.
/// </summary>
/// <remarks>
///     Handler-specific failures still surface as <see cref="AgentHandlerExecutionException" /> on the
///     <see cref="Exception.InnerException" /> chain when applicable.
/// </remarks>
public sealed class AgentExecutionFailedException : Exception
{
    private const string BatchTaskCorrelation = "(batch)";

    public AgentExecutionFailedException(string runId, string? taskId, Exception innerException)
        : base(BuildMessage(runId, taskId), innerException)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        RunId = runId;
        TaskCorrelation = string.IsNullOrWhiteSpace(taskId) ? BatchTaskCorrelation : taskId;
    }

    public string RunId { get; }

    /// <summary>
    ///     Either the originating agent task id or <c>(batch)</c> when the failure is not attributable to a single task.
    /// </summary>
    public string TaskCorrelation { get; }

    private static string BuildMessage(string runId, string? taskId)
    {
        string correlation = string.IsNullOrWhiteSpace(taskId) ? BatchTaskCorrelation : taskId;

        return $"Agent execution failed for run '{runId}', task '{correlation}'.";
    }
}
