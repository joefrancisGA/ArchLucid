using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <summary>
///     Selective execute demotion, idempotency, cooperative cancellation, and execute-completion legacy status.
/// </summary>
public interface IArchitectureRunExecutePreExecuteStage
{
    Task TryDemoteReadyForCommitBeforeSelectiveExecuteAsync(
        string runId,
        ArchitectureRunStatus currentStatus,
        CancellationToken cancellationToken);

    Task<ExecuteRunResult?> TryReturnExistingExecuteResultsAsync(
        ArchitectureRun run,
        string runId,
        CancellationToken cancellationToken);

    Task ThrowIfCooperativeCancelRequestedAsync(string runId, CancellationToken cancellationToken);

    Task TryApplyExecuteCompletionLegacyStatusAsync(
        string runId,
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken);
}
