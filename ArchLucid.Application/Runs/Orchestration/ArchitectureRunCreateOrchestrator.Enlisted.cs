using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration;

public sealed partial class ArchitectureRunCreateOrchestrator
{
    private async Task<CreateRunResult> CompleteAcceptedCreateWithDetachedCoordinationAsync(
        Guid runId,
        ArchitectureRequest request,
        CancellationToken cancellationToken)
    {
        string actor = _actorContext.GetActor();
        CoordinationResult? coordination = null;

        try
        {
            coordination = await _authorityCoordination.CreateRunAsync(
                request,
                cancellationToken,
                enlistUnitOfWork: null,
                runId);

            if (!coordination.Success)
            {
                string detail = string.Join("; ", coordination.Errors);
                await _baselineMutationAudit.RecordAsync(
                    AuditEventTypes.Baseline.Architecture.RunFailed,
                    actor,
                    request.RequestId,
                    $"Coordination failed: {detail}",
                    cancellationToken);
                throw new InvalidOperationException($"CreateRun failed: {detail}");
            }

            await using IArchLucidUnitOfWork uow = await _unitOfWorkFactory.CreateAsync(cancellationToken);

            try
            {
                await _persistenceHelper.PersistCreateRunRowsAsync(
                    request,
                    coordination,
                    idempotency: null,
                    uow,
                    persistArchitectureRequest: false,
                    cancellationToken);
                await _persistenceHelper.PatchRunHeaderInTransactionAsync(
                    coordination,
                    request,
                    uow,
                    cancellationToken);

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
            if (ex is not InvalidOperationException invalid
                || !invalid.Message.StartsWith("CreateRun failed:", StringComparison.Ordinal))
            {
                string runOrRequestId = coordination?.Run?.RunId ?? request.RequestId;
                await _baselineMutationAudit.RecordAsync(
                    AuditEventTypes.Baseline.Architecture.RunFailed,
                    actor,
                    runOrRequestId,
                    $"Persist failed: {ex.GetType().Name}",
                    cancellationToken);
            }

            await TryMarkAdmittedCreateFailedAsync(runId, ex, cancellationToken);
            throw;
        }

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformationCreatingArchitectureRun(
                coordination!.Run.RunId,
                request.RequestId,
                request.SystemName,
                request.Environment);
        }

        return new CreateRunResult
        {
            Run = coordination.Run,
            EvidenceBundle = coordination.EvidenceBundle,
            Tasks = coordination.Tasks
        };
    }

    private async Task<CreateRunResult> CreateRunWithEnlistedCoordinationAsync(
        ArchitectureRequest request,
        CreateRunIdempotencyState? idempotency,
        CancellationToken cancellationToken)
    {
        string actor = _actorContext.GetActor();
        bool inserted;
        CoordinationResult? coordination = null;

        try
        {
            await using IArchLucidUnitOfWork uow = await _unitOfWorkFactory.CreateAsync(cancellationToken);

            try
            {
                coordination = await _authorityCoordination.CreateRunAsync(request, cancellationToken, uow);

                if (!coordination.Success)
                {
                    string detail = string.Join("; ", coordination.Errors);
                    await _baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunFailed, actor, request.RequestId,
                        $"Coordination failed: {detail}", cancellationToken);
                    throw new InvalidOperationException($"CreateRun failed: {detail}");
                }

                inserted = await _persistenceHelper.PersistCreateRunRowsAsync(
                    request,
                    coordination,
                    idempotency,
                    uow,
                    persistArchitectureRequest: true,
                    cancellationToken);
                await _persistenceHelper.PatchRunHeaderInTransactionAsync(
                    coordination,
                    request,
                    uow,
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
            if (ex is not InvalidOperationException invalid || !invalid.Message.StartsWith("CreateRun failed:", StringComparison.Ordinal))
            {
                string runOrRequestId = coordination?.Run?.RunId ?? request.RequestId;
                await _baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunFailed, actor, runOrRequestId,
                    $"Persist failed: {ex.GetType().Name}", cancellationToken);
            }

            throw;
        }

        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformationCreatingArchitectureRun(coordination!.Run.RunId, request.RequestId, request.SystemName, request.Environment);

        return await FinalizeSuccessfulCreateRunAsync(request, idempotency, coordination!, inserted, actor, cancellationToken);
    }

    private async Task TryMarkAdmittedCreateFailedAsync(
        Guid runId,
        Exception failure,
        CancellationToken cancellationToken)
    {
        try
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            RunRecord? header = await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

            if (header is null)
                return;

            if (string.Equals(
                    header.LegacyRunStatus,
                    nameof(ArchitectureRunStatus.Committed),
                    StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            header.LegacyRunStatus = nameof(ArchitectureRunStatus.Failed);
            header.CompletedUtc = timeProvider.UtcNowDateTime();
            header.LastFailureReason = failure.GetType().Name + ": " + failure.Message;
            await _runRepository.UpdateAsync(header, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Failed to mark admitted async create as Failed: RunId={RunId}.",
                    runId);
            }
        }
    }
}
