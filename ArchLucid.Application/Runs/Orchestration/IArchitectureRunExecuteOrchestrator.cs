namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Executes agent tasks for a run and persists evidence, results, and evaluations (execute phase).
/// </summary>
public interface IArchitectureRunExecuteOrchestrator
{
    Task<ExecuteRunResult> ExecuteRunAsync(string runId, CancellationToken cancellationToken = default);

    /// <summary>
    ///     TB-938: clear selected (and dependent) agent results, then re-enter <see cref="ExecuteRunAsync" />
    ///     so TB-039 still skips kept successes.
    /// </summary>
    Task<ExecuteRunResult> ExecuteSelectiveRunAsync(
        string runId,
        SelectiveAgentExecuteRequest request,
        CancellationToken cancellationToken = default);
}
