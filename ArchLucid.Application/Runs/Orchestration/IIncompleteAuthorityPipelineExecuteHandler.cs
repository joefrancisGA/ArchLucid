using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Re-run/execute for a deferred authority-pipeline review that never received AgentTasks
///     (ContextSnapshotId still null) must resume the authority pipeline instead of the agent-task loop.
///     The agent-task loop would throw "No tasks found" and persist <c>failureClass=invalidOperation</c>.
/// </summary>
public interface IIncompleteAuthorityPipelineExecuteHandler
{
    /// <summary>
    ///     Returns a result when execute was handled by resuming the authority pipeline;
    ///     otherwise null so the agent-task loop can continue.
    /// </summary>
    Task<ExecuteRunResult?> TryResumeAsync(
        ArchitectureRun run,
        string runId,
        CancellationToken cancellationToken = default);
}
