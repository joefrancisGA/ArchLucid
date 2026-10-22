using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <summary>
///     Pre-agent-loop gates, run-started audit, retry telemetry, and execute-failure tail hooks.
/// </summary>
public interface IArchitectureRunExecuteTailHooksStage
{
    Task LogFailedRunRetryRequestedAsync(
        ArchitectureRun run,
        string runId,
        string actor,
        CancellationToken cancellationToken);

    Task EnsurePreAgentLoopExecuteAllowedAsync(
        string runId,
        string actor,
        CancellationToken cancellationToken);

    Task RecordExecuteRunFailureAsync(
        string runId,
        string actor,
        Exception ex,
        CancellationToken cancellationToken);
}
