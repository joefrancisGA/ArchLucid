using System.Security.Cryptography;
using System.Text.Json;

using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Agents;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Security;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration;

/// <inheritdoc cref = "IArchitectureRunCreateOrchestrator"/>
/// <remarks>
///     When HTTP idempotency is used, <see cref = "IDistributedCreateRunIdempotencyLock"/> serializes concurrent
///     creators for the same key before coordination: SQL hosts use <c>sp_getapplock</c> (cross-replica); InMemory
///     and single-process hosts use <see cref = "InProcessCreateRunIdempotencyLock"/> (per-process semaphores).
///     The authority transaction still relies on <c>dbo.ArchitectureRunIdempotency</c> primary key uniqueness
///     so duplicate inserts fail atomically if two workers race after a lock release.
/// </remarks>
public sealed class ArchitectureRunCreateOrchestrator(
    IArchitectureRunAuthorityCoordination authorityCoordination,
    IArchitectureRequestRepository requestRepository,
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IEvidenceBundleRepository evidenceBundleRepository,
    IAgentTaskRepository taskRepository,
    IArchitectureRunIdempotencyRepository architectureRunIdempotencyRepository,
    IActorContext actorContext,
    IBaselineMutationAuditService baselineMutationAudit,
    IArchLucidUnitOfWorkFactory unitOfWorkFactory,
    IDistributedCreateRunIdempotencyLock distributedCreateRunIdempotencyLock,
    IOptions<ArchitectureRunCreateOptions> createRunOptions,
    IAsyncAuthorityPipelineModeResolver asyncAuthorityPipelineModeResolver,
    IRunStateTransitionService runStateTransitionService,
    IRequestContentSafetyPrecheck requestContentSafetyPrecheck,
    IWorkspaceSystemNameCollisionGuard workspaceSystemNameCollisionGuard,
    ArchitectureRunCreateIdempotencyHelper idempotencyHelper,
    ArchitectureRunCreatePersistenceHelper persistenceHelper,
    ArchitectureRunCreatePostCreateHooks postCreateHooks,
    TimeProvider timeProvider,
    ILogger<ArchitectureRunCreateOrchestrator> logger) : IArchitectureRunCreateOrchestrator
{
    private readonly IOptions<ArchitectureRunCreateOptions> _createRunOptions = createRunOptions ?? throw new ArgumentNullException(nameof(createRunOptions));

    private readonly IRequestContentSafetyPrecheck _requestContentSafetyPrecheck =
        requestContentSafetyPrecheck ?? throw new ArgumentNullException(nameof(requestContentSafetyPrecheck));

    private readonly ArchitectureRunCreatePostCreateHooks _postCreateHooks =
        postCreateHooks ?? throw new ArgumentNullException(nameof(postCreateHooks));

    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IArchitectureRunIdempotencyRepository _architectureRunIdempotencyRepository =
        architectureRunIdempotencyRepository ?? throw new ArgumentNullException(nameof(architectureRunIdempotencyRepository));

    private readonly IArchitectureRunAuthorityCoordination _authorityCoordination =
        authorityCoordination ?? throw new ArgumentNullException(nameof(authorityCoordination));

    private readonly IBaselineMutationAuditService _baselineMutationAudit =
        baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));

    private readonly IDistributedCreateRunIdempotencyLock _distributedCreateRunIdempotencyLock =
        distributedCreateRunIdempotencyLock ?? throw new ArgumentNullException(nameof(distributedCreateRunIdempotencyLock));

    private readonly IAsyncAuthorityPipelineModeResolver _asyncAuthorityPipelineModeResolver =
        asyncAuthorityPipelineModeResolver ?? throw new ArgumentNullException(nameof(asyncAuthorityPipelineModeResolver));

    private readonly IRunStateTransitionService _runStateTransitionService =
        runStateTransitionService ?? throw new ArgumentNullException(nameof(runStateTransitionService));

    private readonly int _distributedIdempotencyLockTimeoutMs =
        ClampDistributedLockTimeout(createRunOptions ?? throw new ArgumentNullException(nameof(createRunOptions)));

    private readonly IEvidenceBundleRepository _evidenceBundleRepository =
        evidenceBundleRepository ?? throw new ArgumentNullException(nameof(evidenceBundleRepository));

    private readonly ILogger<ArchitectureRunCreateOrchestrator> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IArchitectureRequestRepository _requestRepository = requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));
    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
    private readonly IAgentTaskRepository _taskRepository = taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));
    private readonly IArchLucidUnitOfWorkFactory _unitOfWorkFactory = unitOfWorkFactory ?? throw new ArgumentNullException(nameof(unitOfWorkFactory));

    private readonly IWorkspaceSystemNameCollisionGuard _workspaceSystemNameCollisionGuard =
        workspaceSystemNameCollisionGuard ?? throw new ArgumentNullException(nameof(workspaceSystemNameCollisionGuard));

    private readonly ArchitectureRunCreateIdempotencyHelper _idempotencyHelper =
        idempotencyHelper ?? throw new ArgumentNullException(nameof(idempotencyHelper));

    private readonly ArchitectureRunCreatePersistenceHelper _persistenceHelper =
        persistenceHelper ?? throw new ArgumentNullException(nameof(persistenceHelper));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <inheritdoc/>
    public async Task<CreateRunResult> CreateRunAsync(ArchitectureRequest request, CreateRunIdempotencyState? idempotency = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        QuickStartIntakeRequestEnricher.EnrichIfQuickStart(request);

        string? documentUrlRejection = await AllowedDocumentUrlPolicy
            .TryGetFirstDocumentRejectionReasonAfterDnsResolveAsync(request.Documents, cancellationToken)
            .ConfigureAwait(false);

        if (documentUrlRejection is not null)
            throw new InvalidOperationException(documentUrlRejection);

        RequestContentSafetyResult safety = await _requestContentSafetyPrecheck.EvaluateAsync(request, cancellationToken).ConfigureAwait(false);
        if (!safety.IsAllowed)
        {
            string actor = _actorContext.GetActor();
            await _baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunFailed, actor, request.RequestId,
                $"Request content failed safety precheck: {string.Join("; ", safety.Reasons)}", cancellationToken).ConfigureAwait(false);
            throw new RequestContentSafetyRejectedException(safety.Reasons);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        // ReSharper disable once InvertIf
        if (idempotency is not null)
        {
            CreateRunResult? replay = await _idempotencyHelper.TryReplayFromIdempotencyAsync(idempotency, cancellationToken);

            if (replay is not null)
                return replay;

            string gateKey = ArchitectureRunCreateIdempotencyHelper.BuildIdempotencyGateKey(idempotency);
            await using IAsyncDisposable _ = await _distributedCreateRunIdempotencyLock
                .AcquireExclusiveSessionLockAsync(gateKey, _distributedIdempotencyLockTimeoutMs, cancellationToken).ConfigureAwait(false);
            CreateRunResult? replayUnderDistributed = await _idempotencyHelper.TryReplayFromIdempotencyAsync(idempotency, cancellationToken);

            if (replayUnderDistributed is not null)
                return replayUnderDistributed;

            await _workspaceSystemNameCollisionGuard
                .EnsureAvailableAsync(scope, request.SystemName, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            return await CreateRunWithCoordinationAsync(request, idempotency, cancellationToken);
        }

        CreateRunResult? fingerprintReplay = await _idempotencyHelper
            .TryReplayFromRecentFingerprintAsync(scope, request, cancellationToken)
            .ConfigureAwait(false);

        if (fingerprintReplay is not null)
            return fingerprintReplay;

        await _workspaceSystemNameCollisionGuard
            .EnsureAvailableAsync(scope, request.SystemName, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        return await CreateRunWithCoordinationAsync(request, idempotency, cancellationToken);
    }

    /// <inheritdoc />
    public async Task CompleteAsyncAcceptedCreateRunAsync(
        Guid runId,
        ArchitectureRequest request,
        CreateRunIdempotencyState? idempotency,
        CancellationToken cancellationToken = default,
        string? actorOverride = null)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (runId == Guid.Empty)
            throw new ArgumentException("Run id must be non-empty.", nameof(runId));

        string actor = ResolveCreateActor(actorOverride);
        QuickStartIntakeRequestEnricher.EnrichIfQuickStart(request);

        string? documentUrlRejection = await AllowedDocumentUrlPolicy
            .TryGetFirstDocumentRejectionReasonAfterDnsResolveAsync(request.Documents, cancellationToken)
            .ConfigureAwait(false);

        if (documentUrlRejection is not null)
            throw new InvalidOperationException(documentUrlRejection);

        RequestContentSafetyResult safety =
            await _requestContentSafetyPrecheck.EvaluateAsync(request, cancellationToken).ConfigureAwait(false);

        if (!safety.IsAllowed)
        {
            await _baselineMutationAudit.RecordAsync(
                AuditEventTypes.Baseline.Architecture.RunFailed,
                actor,
                request.RequestId,
                $"Request content failed safety precheck: {string.Join("; ", safety.Reasons)}",
                cancellationToken).ConfigureAwait(false);
            throw new RequestContentSafetyRejectedException(safety.Reasons);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        await _workspaceSystemNameCollisionGuard
            .EnsureAvailableAsync(scope, request.SystemName, excludeRunId: runId, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        // Do not open the completion UoW until coordination returns. Dapper begins a SQL
        // transaction in CreateAsync; holding it across ingestion/graph/LLM serializes later admits.
        CreateRunResult result = await CompleteAcceptedCreateWithDetachedCoordinationAsync(
            runId,
            request,
            cancellationToken);

        if (idempotency is not null && result.IdempotentReplay)
            return;

        await FinalizeSuccessfulCreateRunAsync(
            request,
            idempotency: null,
            new CoordinationResult
            {
                Run = result.Run,
                EvidenceBundle = result.EvidenceBundle,
                Tasks = result.Tasks
            },
            inserted: true,
            actor,
            cancellationToken);
    }

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

    /// <summary>
    ///     Lock wait budget (shared by SQL <c>sp_getapplock</c> and in-process semaphores) while another caller holds
    ///     the same idempotency key. The lock spans coordinator + persistence.
    /// </summary>
    private static int ClampDistributedLockTimeout(IOptions<ArchitectureRunCreateOptions> options)
    {
        int ms = options.Value.DistributedIdempotencyLockTimeoutMilliseconds;
        if (ms < 1_000)
            return 1_000;

        // Ceiling must allow losers to wait for the slowest winner across authority pipeline plus SQL variance
        // (greenfield CI sets AuthorityPipeline:PipelineTimeout above the historical 25-minute cap).
        const int absoluteMaxDistributedIdempotencyLockWaitMilliseconds = 3_600_000;

        return ms > absoluteMaxDistributedIdempotencyLockWaitMilliseconds
            ? absoluteMaxDistributedIdempotencyLockWaitMilliseconds
            : ms;
    }

    private async Task<CreateRunResult> CreateRunWithCoordinationAsync(ArchitectureRequest request, CreateRunIdempotencyState? idempotency,
        CancellationToken cancellationToken)
    {
        bool useEnlistedUnitOfWork = await _asyncAuthorityPipelineModeResolver
            .ShouldQueueContextAndGraphStagesAsync(cancellationToken);

        if (useEnlistedUnitOfWork)
            return await CreateRunWithEnlistedCoordinationAsync(request, idempotency, cancellationToken);

        return await CreateRunWithSyncCoordinationAsync(request, idempotency, cancellationToken);
    }

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

    private async Task<CreateRunResult> FinalizeSuccessfulCreateRunAsync(
        ArchitectureRequest request,
        CreateRunIdempotencyState? idempotency,
        CoordinationResult coordination,
        bool inserted,
        string actor,
        CancellationToken cancellationToken)
    {
        if (idempotency is not null && !inserted)
        {
            CreateRunResult? winner = await _idempotencyHelper.ResolveIdempotencyRaceAsync(idempotency, cancellationToken);
            return winner ?? throw new InvalidOperationException("Idempotency insert failed but no winning row was found; retry the request.");
        }

        await _baselineMutationAudit.RecordAsync(AuditEventTypes.Baseline.Architecture.RunCreated, actor, coordination.Run.RunId,
            $"RequestId={request.RequestId}; Environment={request.Environment}; SystemName={request.SystemName}", cancellationToken);

        await _postCreateHooks.ExecuteAsync(request, coordination, actor, cancellationToken);

        return new CreateRunResult { Run = coordination.Run, EvidenceBundle = coordination.EvidenceBundle, Tasks = coordination.Tasks };
    }

    private static bool TryParseCoordinationRunGuid(string runId, out Guid runGuid) =>
        Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);

    private string ResolveCreateActor(string? actorOverride)
    {
        if (!string.IsNullOrWhiteSpace(actorOverride))
            return actorOverride;

        return _actorContext.GetActor();
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
