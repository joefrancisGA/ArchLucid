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
public sealed partial class ArchitectureRunCreateOrchestrator(
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
}
