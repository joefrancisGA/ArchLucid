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
    IAuditService auditService,
    IArchLucidUnitOfWorkFactory unitOfWorkFactory,
    IUsageMeteringService usageMetering,
    IDistributedCreateRunIdempotencyLock distributedCreateRunIdempotencyLock,
    IOptions<ArchitectureRunCreateOptions> createRunOptions,
    IAsyncAuthorityPipelineModeResolver asyncAuthorityPipelineModeResolver,
    IRunStateTransitionService runStateTransitionService,
    TimeProvider timeProvider,
    IRequestContentSafetyPrecheck requestContentSafetyPrecheck,
    DefaultPolicyPackCloudBaselineApplicator defaultPolicyPackCloudBaselineApplicator,
    IWorkspaceSystemNameCollisionGuard workspaceSystemNameCollisionGuard,
    IArchitectureIdentityService architectureIdentityService,
    ILogger<ArchitectureRunCreateOrchestrator> logger) : IArchitectureRunCreateOrchestrator
{
    private readonly IOptions<ArchitectureRunCreateOptions> _createRunOptions = createRunOptions ?? throw new ArgumentNullException(nameof(createRunOptions));

    private readonly IRequestContentSafetyPrecheck _requestContentSafetyPrecheck =
        requestContentSafetyPrecheck ?? throw new ArgumentNullException(nameof(requestContentSafetyPrecheck));

    private readonly DefaultPolicyPackCloudBaselineApplicator _defaultPolicyPackCloudBaselineApplicator =
        defaultPolicyPackCloudBaselineApplicator ?? throw new ArgumentNullException(nameof(defaultPolicyPackCloudBaselineApplicator));

    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IArchitectureRunIdempotencyRepository _architectureRunIdempotencyRepository =
        architectureRunIdempotencyRepository ?? throw new ArgumentNullException(nameof(architectureRunIdempotencyRepository));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

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
    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));
    private readonly IArchLucidUnitOfWorkFactory _unitOfWorkFactory = unitOfWorkFactory ?? throw new ArgumentNullException(nameof(unitOfWorkFactory));
    private readonly IUsageMeteringService _usageMetering = usageMetering ?? throw new ArgumentNullException(nameof(usageMetering));

    private readonly IWorkspaceSystemNameCollisionGuard _workspaceSystemNameCollisionGuard =
        workspaceSystemNameCollisionGuard ?? throw new ArgumentNullException(nameof(workspaceSystemNameCollisionGuard));

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
            CreateRunResult? replay = await TryReplayFromIdempotencyAsync(idempotency, cancellationToken);
            if (replay is not null)
                return replay;
            string gateKey = BuildIdempotencyGateKey(idempotency);
            await using IAsyncDisposable _ = await _distributedCreateRunIdempotencyLock
                .AcquireExclusiveSessionLockAsync(gateKey, _distributedIdempotencyLockTimeoutMs, cancellationToken).ConfigureAwait(false);
            CreateRunResult? replayUnderDistributed = await TryReplayFromIdempotencyAsync(idempotency, cancellationToken);
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
            .EnsureAvailableAsync(scope, request.SystemName, cancellationToken: cancellationToken)
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
                await PersistCreateRunRowsAsync(
                    request,
                    coordination,
                    idempotency: null,
                    uow,
                    persistArchitectureRequest: false,
                    cancellationToken);
                await PatchRunHeaderInTransactionAsync(
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
        await EnsureArchitectureRequestPersistedAsync(request, cancellationToken).ConfigureAwait(false);

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
                inserted = await PersistCreateRunRowsAsync(
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

                inserted = await PersistCreateRunRowsAsync(
                    request,
                    coordination,
                    idempotency,
                    uow,
                    persistArchitectureRequest: true,
                    cancellationToken);
                await PatchRunHeaderInTransactionAsync(
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
            CreateRunResult? winner = await ResolveIdempotencyRaceAsync(idempotency, cancellationToken);
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
        requestCreated.ExplicitActor = true;

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
        requestLocked.ExplicitActor = true;

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

    private static bool TryParseCoordinationRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }

    private static string BuildIdempotencyGateKey(CreateRunIdempotencyState idempotency)
    {
        ArgumentNullException.ThrowIfNull(idempotency);
        byte[] hash = idempotency.IdempotencyKeyHash;
        if (hash is null || hash.Length == 0)
            throw new ArgumentException("Idempotency key hash must be non-empty.", nameof(idempotency));
        return string.Concat(idempotency.TenantId.ToString("N"), "|", idempotency.WorkspaceId.ToString("N"), "|", idempotency.ProjectId.ToString("N"), "|",
            Convert.ToHexString(hash));
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

    private async Task EnsureArchitectureRequestPersistedAsync(
        ArchitectureRequest request,
        CancellationToken cancellationToken)
    {
        ArchitectureRequest? existing =
            await _requestRepository.GetByIdAsync(request.RequestId, cancellationToken).ConfigureAwait(false);

        if (existing is not null)
            return;

        await _requestRepository.CreateAsync(request, cancellationToken).ConfigureAwait(false);
    }

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

    private async Task<bool> PersistCreateRunRowsAsync(
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
            ? await _architectureRunIdempotencyRepository.TryInsertAsync(idempotency.TenantId, idempotency.WorkspaceId, idempotency.ProjectId,
                idempotency.IdempotencyKeyHash, idempotency.RequestFingerprint, coordination.Run.RunId, cancellationToken, uow.Connection, uow.Transaction)
            : await _architectureRunIdempotencyRepository.TryInsertAsync(idempotency.TenantId, idempotency.WorkspaceId, idempotency.ProjectId,
                idempotency.IdempotencyKeyHash, idempotency.RequestFingerprint, coordination.Run.RunId, cancellationToken);
        if (inserted)
            return inserted;
        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Idempotency insert did not win race for RunId={RunId}; unit of work will roll back when not committed.",
                LogSanitizer.Sanitize(coordination.Run.RunId));
        return inserted;
    }

    private async Task PatchRunHeaderInTransactionAsync(
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

    private async Task<CreateRunResult?> TryReplayFromIdempotencyAsync(CreateRunIdempotencyState idempotency, CancellationToken cancellationToken)
    {
        ArchitectureRunIdempotencyLookup? existing = await _architectureRunIdempotencyRepository.TryGetAsync(idempotency.TenantId, idempotency.WorkspaceId,
            idempotency.ProjectId, idempotency.IdempotencyKeyHash, cancellationToken);
        if (existing is null)
            return null;
        if (!CryptographicOperations.FixedTimeEquals(existing.RequestFingerprint, idempotency.RequestFingerprint))
            throw new ConflictException("The Idempotency-Key was already used with a different request body.");
        return await RehydrateCreateRunResultAsync(existing.RunId, cancellationToken);
    }

    private async Task<CreateRunResult?> ResolveIdempotencyRaceAsync(CreateRunIdempotencyState idempotency, CancellationToken cancellationToken)
    {
        ArchitectureRunIdempotencyLookup? winner = await _architectureRunIdempotencyRepository.TryGetAsync(idempotency.TenantId, idempotency.WorkspaceId,
            idempotency.ProjectId, idempotency.IdempotencyKeyHash, cancellationToken);
        if (winner is null)
            return null;
        if (!CryptographicOperations.FixedTimeEquals(winner.RequestFingerprint, idempotency.RequestFingerprint))
            throw new ConflictException("The Idempotency-Key was already used with a different request body.");
        return await RehydrateCreateRunResultAsync(winner.RunId, cancellationToken);
    }

    private async Task<CreateRunResult> RehydrateCreateRunResultAsync(string runId, CancellationToken cancellationToken)
    {
        ArchitectureRun? run =
            await ArchitectureRunAuthorityReader.TryGetArchitectureRunAsync(_runRepository, _scopeContextProvider, _taskRepository, runId, cancellationToken);
        if (run is null)
            throw new InvalidOperationException($"Run '{runId}' from idempotency store was not found.");
        ScopeContext rehydrateScope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<AgentTask> tasks = await _taskRepository.GetByRunIdAsync(rehydrateScope, runId, cancellationToken);
        if (tasks.Count == 0)
            throw new InvalidOperationException($"Idempotent run '{runId}' has no tasks.");
        string? bundleRef = tasks[0].EvidenceBundleRef;
        if (string.IsNullOrWhiteSpace(bundleRef))
            throw new InvalidOperationException($"Idempotent run '{runId}' is missing EvidenceBundleRef on the first task.");
        EvidenceBundle bundle = await _evidenceBundleRepository.GetByIdAsync(bundleRef, cancellationToken) ??
                                throw new InvalidOperationException($"Evidence bundle '{bundleRef}' for idempotent run was not found.");
        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("CreateRun idempotent replay: RunId={RunId}, TaskCount={TaskCount}", LogSanitizer.Sanitize(runId), tasks.Count);
        return new CreateRunResult { Run = run, EvidenceBundle = bundle, Tasks = tasks.ToList(), IdempotentReplay = true };
    }
}
