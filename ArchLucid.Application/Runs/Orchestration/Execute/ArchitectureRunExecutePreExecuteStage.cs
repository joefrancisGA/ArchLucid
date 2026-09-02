using ArchLucid.Application.Common;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <inheritdoc cref="IArchitectureRunExecutePreExecuteStage" />
public sealed class ArchitectureRunExecutePreExecuteStage(
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IArchitectureRunExecuteIdempotencyStage idempotencyStage,
    IArchitectureRunExecuteCancellationGuardStage cancellationGuardStage) : IArchitectureRunExecutePreExecuteStage
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IArchitectureRunExecuteIdempotencyStage _idempotencyStage =
        idempotencyStage ?? throw new ArgumentNullException(nameof(idempotencyStage));

    private readonly IArchitectureRunExecuteCancellationGuardStage _cancellationGuardStage =
        cancellationGuardStage ?? throw new ArgumentNullException(nameof(cancellationGuardStage));

    /// <inheritdoc />
    public async Task TryDemoteReadyForCommitBeforeSelectiveExecuteAsync(
        string runId,
        ArchitectureRunStatus currentStatus,
        CancellationToken cancellationToken)
    {
        if (currentStatus is not ArchitectureRunStatus.ReadyForCommit)
            return;

        if (!ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? header = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (header is null)
            return;

        if (string.Equals(header.LegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
        {
            throw new ConflictException(
                $"Run '{runId}' is already committed and cannot be selectively re-executed.");
        }

        header.LegacyRunStatus = nameof(ArchitectureRunStatus.WaitingForResults);
        await _runRepository.UpdateAsync(header, cancellationToken);
    }

    /// <inheritdoc />
    public Task<ExecuteRunResult?> TryReturnExistingExecuteResultsAsync(
        ArchitectureRun run,
        string runId,
        CancellationToken cancellationToken) =>
        _idempotencyStage.TryReturnExistingExecuteResultsAsync(run, runId, cancellationToken);

    /// <inheritdoc />
    public Task ThrowIfCooperativeCancelRequestedAsync(string runId, CancellationToken cancellationToken) =>
        _cancellationGuardStage.ThrowIfCooperativeCancelRequestedAsync(runId, cancellationToken);

    /// <inheritdoc />
    public Task TryApplyExecuteCompletionLegacyStatusAsync(
        string runId,
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken) =>
        _idempotencyStage.TryApplyExecuteCompletionLegacyStatusAsync(runId, results, cancellationToken);

    internal static bool ArePersistedResultsCompleteForTasks(
        IReadOnlyList<AgentTask> tasks,
        IReadOnlyList<AgentResult> existingResults) =>
        ArchitectureRunExecuteIdempotencyStage.ArePersistedResultsCompleteForTasksCore(tasks, existingResults);
}
