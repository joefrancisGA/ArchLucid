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
    IAuditService auditService,
    IUsageMeteringService usageMetering,
    TimeProvider timeProvider,
    DefaultPolicyPackCloudBaselineApplicator defaultPolicyPackCloudBaselineApplicator,
    IArchitectureIdentityService architectureIdentityService,
    ILogger<ArchitectureRunCreateOrchestrator> logger) : IArchitectureRunCreateOrchestrator
{
    private readonly IOptions<ArchitectureRunCreateOptions> _createRunOptions = createRunOptions ?? throw new ArgumentNullException(nameof(createRunOptions));

    private readonly IRequestContentSafetyPrecheck _requestContentSafetyPrecheck =
        requestContentSafetyPrecheck ?? throw new ArgumentNullException(nameof(requestContentSafetyPrecheck));

    private readonly DefaultPolicyPackCloudBaselineApplicator _defaultPolicyPackCloudBaselineApplicator =
        defaultPolicyPackCloudBaselineApplicator ?? throw new ArgumentNullException(nameof(defaultPolicyPackCloudBaselineApplicator));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

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

    private readonly IUsageMeteringService _usageMetering =
        usageMetering ?? throw new ArgumentNullException(nameof(usageMetering));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly IArchitectureIdentityService _architectureIdentityService =
        architectureIdentityService ?? throw new ArgumentNullException(nameof(architectureIdentityService));

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
        await _workspaceSystemNameCollisionGuard
            .EnsureAvailableAsync(scope, request.SystemName, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

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
            return await CreateRunWithCoordinationAsync(request, idempotency, cancellationToken);
        }

        return await CreateRunWithCoordinationAsync(request, idempotency, cancellationToken);
    }

    /// <inheritdoc />
    public async Task CompleteAsyncAcceptedCreateRunAsync(
        Guid runId,
        ArchitectureRequest request,
        CreateRunIdempotencyState? idempotency,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (runId == Guid.Empty)
            throw new ArgumentException("Run id must be non-empty.", nameof(runId));

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
            string actor = _actorContext.GetActor();
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
            .EnsureAvailableAsync(scope, request.SystemName, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        // Do not enlist the HTTP/worker unit of work across authority coordination. Holding that
        // transaction for ingestion/graph/LLM work serializes later async admits (the 60s UI proxy
        // then reports a false create failure). Coordination uses its own short UoW / queue.
        CreateRunResult result = await CompleteAcceptedCreateWithDetachedCoordinationAsync(
            runId,
            request,
            cancellationToken);

        if (idempotency is not null && result.IdempotentReplay)
            return;

        string completionActor = _actorContext.GetActor();
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
            completionActor,
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
            await using IArchLucidUnitOfWork uow = await _unitOfWorkFactory.CreateAsync(cancellationToken);

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

        ScopeContext scopeCtx = _scopeContextProvider.GetCurrentScope();

        if (!TryParseCoordinationRunGuid(coordination.Run.RunId, out Guid runGuid))
            runGuid = Guid.Empty;

        AuditEvent requestCreated = scopeCtx.CreateAuditEvent(
            AuditEventTypes.RequestCreated,
            actor,
            actor,
            JsonSerializer.Serialize(
                new
                {
                    requestId = request.RequestId,
                    runId = coordination.Run.RunId,
                    systemName = request.SystemName,
                    environment = request.Environment,
                    cloudProvider = request.CloudProvider.ToString()
                }, AuditJsonSerializationOptions.Instance));
        requestCreated.RunId = runGuid == Guid.Empty ? null : runGuid;

        await DurableAuditLogRetry.TryLogAsync(
            ct => _auditService.LogAsync(requestCreated, ct),
            _logger,
            $"{AuditEventTypes.RequestCreated}:{LogSanitizer.Sanitize(coordination.Run.RunId)}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.RequestCreated);

        AuditEvent requestLocked = scopeCtx.CreateAuditEvent(
            AuditEventTypes.RequestLocked,
            actor,
            actor,
            JsonSerializer.Serialize(
                new
                {
                    requestId = request.RequestId,
                    runId = coordination.Run.RunId,
                    rationale =
                        "Run persisted for this ArchitectureRequest — request is scoped as locked relative to drafts until terminal runs settle."
                }, AuditJsonSerializationOptions.Instance));
        requestLocked.RunId = runGuid == Guid.Empty ? null : runGuid;

        await DurableAuditLogRetry.TryLogAsync(
            ct => _auditService.LogAsync(requestLocked, ct),
            _logger,
            $"{AuditEventTypes.RequestLocked}:{LogSanitizer.Sanitize(coordination.Run.RunId)}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.RequestLocked);

        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Architecture run created: RunId={RunId}, TaskCount={TaskCount}", LogSanitizer.Sanitize(coordination.Run.RunId),
                coordination.Tasks.Count);
        await TryRecordArchitectureRunMeteringAsync(_scopeContextProvider.GetCurrentScope(), coordination.Run.RunId, cancellationToken);
        await TryApplyCloudPolicyPackBaselineAsync(request, cancellationToken);
        await TryLinkReviewRunArchitectureIdentityAsync(request, coordination.Run.RunId, cancellationToken);
        return new CreateRunResult { Run = coordination.Run, EvidenceBundle = coordination.EvidenceBundle, Tasks = coordination.Tasks };
    }

    private async Task TryLinkReviewRunArchitectureIdentityAsync(
        ArchitectureRequest request,
        string runId,
        CancellationToken cancellationToken)
    {
        if (!TryParseCoordinationRunGuid(runId, out Guid reviewRunGuid))
            return;

        try
        {
            await _architectureIdentityService
                .TryEnsureReviewRunLinkedAsync(_scopeContextProvider.GetCurrentScope(), reviewRunGuid, request, cancellationToken: cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Review run architecture identity link failed for RunId={RunId}.",
                    LogSanitizer.Sanitize(runId));
            }
        }
    }

    private async Task TryApplyCloudPolicyPackBaselineAsync(
        ArchitectureRequest request,
        CancellationToken cancellationToken)
    {
        if (request.CloudProvider is not (CloudProvider.Aws or CloudProvider.Gcp))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            return;

        try
        {
            await _defaultPolicyPackCloudBaselineApplicator.TryApplyAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                request.CloudProvider,
                cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Cloud policy pack baseline adjustment failed for architecture run (CloudProvider={CloudProvider}).",
                    request.CloudProvider);
            }
        }
    }

    private async Task TryRecordArchitectureRunMeteringAsync(ScopeContext scope, string runId, CancellationToken cancellationToken)
    {
        if (scope.TenantId == Guid.Empty)
            return;
        try
        {
            await _usageMetering
                .RecordAsync(
                    new UsageEvent
                    {
                        TenantId = scope.TenantId,
                        WorkspaceId = scope.WorkspaceId,
                        ProjectId = scope.ProjectId,
                        Kind = UsageMeterKind.ArchitectureRun,
                        Quantity = 1,
                        RecordedUtc = _timeProvider.GetUtcNow(),
                        CorrelationId = runId,
                        IdempotencyKey = UsageEventIdempotencyKeys.ForArchitectureRun(runId)
                    }, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Usage metering failed for architecture run (tenant {TenantId}).", scope.TenantId);
        }
    }

    private static bool TryParseCoordinationRunGuid(string runId, out Guid runGuid) =>
        Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);

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
