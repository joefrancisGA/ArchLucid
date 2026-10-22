using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <summary>
///     Execute-run activity, logging, and exception telemetry around the core sequencer.
/// </summary>
public interface IArchitectureRunExecuteTelemetryStage
{
    Task<ExecuteRunResult> ExecuteWithTelemetryAsync(
        string runId,
        string actor,
        Func<CancellationToken, Task<ExecuteRunResult>> executeCore,
        Func<string, string, Exception, CancellationToken, Task> recordFailure,
        CancellationToken cancellationToken);
}
