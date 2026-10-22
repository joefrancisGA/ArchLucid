using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration;

public sealed partial class ArchitectureRunCreateOrchestrator
{
    private async Task<CreateRunResult> CreateRunWithSyncCoordinationAsync(
        ArchitectureRequest request,
        CreateRunIdempotencyState? idempotency,
        CancellationToken cancellationToken)
    {
        string actor = _actorContext.GetActor();

        // Persist ArchitectureRequest before the early-committed Runs header so a crash mid-pipeline
        // cannot leave runs_missing_architecture_request orphans that degrade /health/ready.
        await _persistenceHelper.EnsureArchitectureRequestPersistedAsync(request, cancellationToken).ConfigureAwait(false);

        CoordinationResult coordination = await _authorityCoordination.CreateRunAsync(request, cancellationToken);

        if (!coordination.Success)
        {
            string detail = string.Join("; ", coordination.Errors);
            await _baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunFailed, actor, request.RequestId,
                $"Coordination failed: {detail}", cancellationToken);
            throw new InvalidOperationException($"CreateRun failed: {detail}");
        }

        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformationCreatingArchitectureRun(coordination.Run.RunId, request.RequestId, request.SystemName, request.Environment);

        bool inserted;

        try
        {
            await using IArchLucidUnitOfWork uow = await _unitOfWorkFactory.CreateAsync(cancellationToken);

            try
            {
                inserted = await _persistenceHelper.PersistCreateRunRowsAsync(
                    request,
                    coordination,
                    idempotency,
                    uow,
                    persistArchitectureRequest: false,
                    cancellationToken);

                if (inserted || idempotency is null)
                    await uow.CommitAsync(cancellationToken);
            }
            catch
            {
                await uow.RollbackAsync(cancellationToken);
                throw;
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            await _baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunFailed, actor, coordination.Run.RunId,
                $"Persist failed: {ex.GetType().Name}", cancellationToken);
            await TryCompensateArchiveOrphanRunAsync(coordination.Run.RunId, cancellationToken).ConfigureAwait(false);
            throw;
        }

        return await FinalizeSuccessfulCreateRunAsync(request, idempotency, coordination, inserted, actor, cancellationToken);
    }

    private async Task TryCompensateArchiveOrphanRunAsync(string runId, CancellationToken cancellationToken)
    {
        if (!TryParseCoordinationRunGuid(runId, out Guid runGuid))
            return;

        try
        {
            RunArchiveByIdsResult archiveResult =
                await _runRepository.ArchiveRunsByIdsAsync([runGuid], cancellationToken).ConfigureAwait(false);

            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    "Compensating soft-archive after sync CreateRun persist failure: RunId={RunId}, Archived={ArchivedCount}, Skipped={SkippedCount}.",
                    LogSanitizer.Sanitize(runId),
                    archiveResult.SucceededRunIds.Count,
                    archiveResult.Failed.Count);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Compensating soft-archive failed after sync CreateRun persist failure: RunId={RunId}.",
                    LogSanitizer.Sanitize(runId));
            }
        }
    }
}
