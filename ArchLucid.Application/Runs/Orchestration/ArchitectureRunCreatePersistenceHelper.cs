using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Persistence helpers for architecture run create transactions (request, evidence, tasks, idempotency rows).
/// </summary>
public sealed class ArchitectureRunCreatePersistenceHelper(
    IArchitectureRequestRepository requestRepository,
    IEvidenceBundleRepository evidenceBundleRepository,
    IAgentTaskRepository taskRepository,
    IArchitectureRunIdempotencyRepository architectureRunIdempotencyRepository,
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IRunStateTransitionService runStateTransitionService,
    ILogger<ArchitectureRunCreatePersistenceHelper> logger)
{
    private readonly IArchitectureRequestRepository _requestRepository =
        requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));

    private readonly IEvidenceBundleRepository _evidenceBundleRepository =
        evidenceBundleRepository ?? throw new ArgumentNullException(nameof(evidenceBundleRepository));

    private readonly IAgentTaskRepository _taskRepository =
        taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));

    private readonly IArchitectureRunIdempotencyRepository _architectureRunIdempotencyRepository =
        architectureRunIdempotencyRepository ?? throw new ArgumentNullException(nameof(architectureRunIdempotencyRepository));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunStateTransitionService _runStateTransitionService =
        runStateTransitionService ?? throw new ArgumentNullException(nameof(runStateTransitionService));

    private readonly ILogger<ArchitectureRunCreatePersistenceHelper> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task EnsureArchitectureRequestPersistedAsync(
        ArchitectureRequest request,
        CancellationToken cancellationToken)
    {
        ArchitectureRequest? existing =
            await _requestRepository.GetByIdAsync(request.RequestId, cancellationToken).ConfigureAwait(false);

        if (existing is not null)
            return;

        await _requestRepository.CreateAsync(request, cancellationToken).ConfigureAwait(false);
    }

    public async Task<bool> PersistCreateRunRowsAsync(
        ArchitectureRequest request,
        CoordinationResult coordination,
        CreateRunIdempotencyState? idempotency,
        IArchLucidUnitOfWork uow,
        bool persistArchitectureRequest,
        CancellationToken cancellationToken)
    {
        if (uow.SupportsExternalTransaction)
        {
            if (persistArchitectureRequest)
                await _requestRepository.CreateAsync(request, cancellationToken, uow.Connection, uow.Transaction);

            await _evidenceBundleRepository.CreateAsync(coordination.EvidenceBundle, cancellationToken, uow.Connection, uow.Transaction);

            if (coordination.Tasks.Count > 0)
                await _taskRepository.CreateManyAsync(coordination.Tasks, cancellationToken, uow.Connection, uow.Transaction);
        }
        else
        {
            if (persistArchitectureRequest)
                await _requestRepository.CreateAsync(request, cancellationToken);

            await _evidenceBundleRepository.CreateAsync(coordination.EvidenceBundle, cancellationToken);

            if (coordination.Tasks.Count > 0)
                await _taskRepository.CreateManyAsync(coordination.Tasks, cancellationToken);
        }

        if (idempotency is null)
            return false;

        bool inserted = uow.SupportsExternalTransaction
            ? await _architectureRunIdempotencyRepository.TryInsertAsync(
                idempotency.TenantId,
                idempotency.WorkspaceId,
                idempotency.ProjectId,
                idempotency.IdempotencyKeyHash,
                idempotency.RequestFingerprint,
                coordination.Run.RunId,
                cancellationToken,
                uow.Connection,
                uow.Transaction)
            : await _architectureRunIdempotencyRepository.TryInsertAsync(
                idempotency.TenantId,
                idempotency.WorkspaceId,
                idempotency.ProjectId,
                idempotency.IdempotencyKeyHash,
                idempotency.RequestFingerprint,
                coordination.Run.RunId,
                cancellationToken);

        if (inserted)
            return inserted;

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Idempotency insert did not win race for RunId={RunId}; unit of work will roll back when not committed.",
                coordination.Run.RunId);
        }

        return inserted;
    }

    public async Task PatchRunHeaderInTransactionAsync(
        CoordinationResult coordination,
        ArchitectureRequest request,
        IArchLucidUnitOfWork uow,
        CancellationToken cancellationToken)
    {
        if (!TryParseCoordinationRunGuid(coordination.Run.RunId, out Guid runId))
            return;

        bool deferred = coordination.Run.Status == ArchitectureRunStatus.Created;
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? header = await _runRepository.GetByIdAsync(scope, runId, cancellationToken);

        if (header is null)
            return;

        header.ArchitectureRequestId = request.RequestId;
        string targetLegacyRunStatus = _runStateTransitionService.GetCoordinationLegacyStatusAfterCreate(deferred);

        if (_runStateTransitionService.ShouldApplyCoordinationLegacyStatusPatch(header.LegacyRunStatus, targetLegacyRunStatus))
            header.LegacyRunStatus = targetLegacyRunStatus;

        header.PackageOrigin = ArchitecturePackageOriginResolver.Resolve(request);

        if (uow.SupportsExternalTransaction)
            await _runRepository.UpdateAsync(header, cancellationToken, uow.Connection, uow.Transaction);
        else
            await _runRepository.UpdateAsync(header, cancellationToken);
    }

    private static bool TryParseCoordinationRunGuid(string runId, out Guid runGuid) =>
        Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
}
