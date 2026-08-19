using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.ApplicationPorts.Interfaces;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.ExecuteOwnership;

/// <inheritdoc cref="IRunExecuteOwnershipReconciliationService" />
public sealed class RunExecuteOwnershipReconciliationService(
    IRunExecuteOwnershipLeaseRepository leaseRepository,
    IRunRepository runRepository,
    IAgentResultRepository agentResultRepository,
    IRunStateTransitionService runStateTransitionService,
    IArchLucidStorageMode storageMode,
    IOptionsMonitor<RunExecuteOwnershipLeaseOptions> optionsMonitor,
    ILogger<RunExecuteOwnershipReconciliationService> logger) : IRunExecuteOwnershipReconciliationService
{
    private static readonly HashSet<string> ReconcilableLegacyStatuses =
    [
        nameof(ArchitectureRunStatus.Created),
        nameof(ArchitectureRunStatus.TasksGenerated),
        nameof(ArchitectureRunStatus.WaitingForResults),
        nameof(ArchitectureRunStatus.Retrying),
    ];

    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly IArchLucidStorageMode _storageMode =
        storageMode ?? throw new ArgumentNullException(nameof(storageMode));

    private readonly IRunExecuteOwnershipLeaseRepository _leaseRepository =
        leaseRepository ?? throw new ArgumentNullException(nameof(leaseRepository));

    private readonly ILogger<RunExecuteOwnershipReconciliationService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IOptionsMonitor<RunExecuteOwnershipLeaseOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IRunStateTransitionService _runStateTransitionService =
        runStateTransitionService ?? throw new ArgumentNullException(nameof(runStateTransitionService));

    /// <inheritdoc />
    public async Task<RunExecuteOwnershipReconciliationReport> ReconcileExpiredLeasesAsync(CancellationToken cancellationToken)
    {
        if (_storageMode.IsInMemory || !_optionsMonitor.CurrentValue.Enabled)
            return new RunExecuteOwnershipReconciliationReport(0, 0, 0);

        RunExecuteOwnershipLeaseOptions options = _optionsMonitor.CurrentValue;
        int batchSize = Math.Clamp(options.MaxReconciliationBatchSize, 1, 500);
        IReadOnlyList<Guid> expiredRunIds = await _leaseRepository
            .ListExpiredRunIdsAsync(TimeProvider.System.GetUtcNow(), batchSize, cancellationToken)
            .ConfigureAwait(false);

        int reconciled = 0;
        int skipped = 0;

        foreach (Guid runId in expiredRunIds)
        {
            bool didReconcile = await TryReconcileOneAsync(runId, cancellationToken).ConfigureAwait(false);

            if (didReconcile)
                reconciled++;
            else
                skipped++;

            await _leaseRepository.TryDeleteAsync(runId, cancellationToken).ConfigureAwait(false);
        }

        if (expiredRunIds.Count > 0 && _logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Execute ownership reconciliation finished. Expired={ExpiredCount}, Reconciled={ReconciledCount}, Skipped={SkippedCount}.",
                expiredRunIds.Count,
                reconciled,
                skipped);
        }

        return new RunExecuteOwnershipReconciliationReport(expiredRunIds.Count, reconciled, skipped);
    }

    private async Task<bool> TryReconcileOneAsync(Guid runId, CancellationToken cancellationToken)
    {
        RunRecord? header = await _runRepository.GetByRunIdAdminAsync(runId, cancellationToken).ConfigureAwait(false);

        if (header is null || header.ArchivedUtc is not null)
            return false;

        string legacyStatus = header.LegacyRunStatus ?? "";

        if (!ReconcilableLegacyStatuses.Contains(legacyStatus))
            return false;

        ScopeContext scope = new()
        {
            TenantId = header.TenantId,
            WorkspaceId = header.WorkspaceId,
            ProjectId = header.ScopeProjectId,
        };

        IReadOnlyList<AgentResult> results =
            await _agentResultRepository.GetByRunIdAsync(scope, runId.ToString("D"), cancellationToken).ConfigureAwait(false);

        ArchitectureRunStatus derived = results.Count > 0
            ? _runStateTransitionService.DeriveStatusAfterExecuteFailure(results)
            : ArchitectureRunStatus.FailedPartial;

        header.LegacyRunStatus = derived.ToString();
        await _runRepository.UpdateAsync(header, cancellationToken).ConfigureAwait(false);

        if (_logger.IsEnabled(LogLevel.Warning))
        {
            _logger.LogWarning(
                "Reconciled expired execute ownership for RunId={RunId} to status {LegacyRunStatus} (persistedResults={ResultCount}).",
                runId,
                header.LegacyRunStatus,
                results.Count);
        }

        return true;
    }
}
