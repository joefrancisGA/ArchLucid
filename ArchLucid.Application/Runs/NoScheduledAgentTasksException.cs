namespace ArchLucid.Application.Runs;

/// <summary>
///     Execute was invoked on a run that has no <c>AgentTask</c> rows yet.
///     Deferred authority-pipeline reviews persist tasks only after the worker (or resume handler)
///     finishes; reaching this exception means that resume did not run and the generic
///     <c>failureClass=invalidOperation</c> payload would otherwise hide the cause.
/// </summary>
public sealed class NoScheduledAgentTasksException : InvalidOperationException
{
    public NoScheduledAgentTasksException(string runId)
        : base($"No tasks found for run '{runId}'.")
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        RunId = runId;
    }

    public string RunId { get; }
}
