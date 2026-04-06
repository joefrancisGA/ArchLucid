using System.Security.Cryptography;
using System.Transactions;

using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Coordinator.Services;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration;

/// <inheritdoc cref="IArchitectureRunCreateOrchestrator"/>
public sealed class ArchitectureRunCreateOrchestrator(
    ICoordinatorService coordinator,
    IArchitectureRequestRepository requestRepository,
    IArchitectureRunRepository runRepository,
    IEvidenceBundleRepository evidenceBundleRepository,
    IAgentTaskRepository taskRepository,
    IArchitectureRunIdempotencyRepository architectureRunIdempotencyRepository,
    IActorContext actorContext,
    IBaselineMutationAuditService baselineMutationAudit,
    ILogger<ArchitectureRunCreateOrchestrator> logger) : IArchitectureRunCreateOrchestrator
{
    private readonly ICoordinatorService _coordinator = coordinator ?? throw new ArgumentNullException(nameof(coordinator));
    private readonly IArchitectureRequestRepository _requestRepository = requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));
    private readonly IArchitectureRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));
    private readonly IEvidenceBundleRepository _evidenceBundleRepository = evidenceBundleRepository ?? throw new ArgumentNullException(nameof(evidenceBundleRepository));
    private readonly IAgentTaskRepository _taskRepository = taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));
    private readonly IArchitectureRunIdempotencyRepository _architectureRunIdempotencyRepository =
        architectureRunIdempotencyRepository ?? throw new ArgumentNullException(nameof(architectureRunIdempotencyRepository));
    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));
    private readonly IBaselineMutationAuditService _baselineMutationAudit = baselineMutationAudit ?? throw new ArgumentNullException(nameof(baselineMutationAudit));
    private readonly ILogger<ArchitectureRunCreateOrchestrator> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<CreateRunResult> CreateRunAsync(
        ArchitectureRequest request,
        CreateRunIdempotencyState? idempotency = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        string actor = _actorContext.GetActor();

        if (idempotency is not null)
        {
            CreateRunResult? replay = await TryReplayFromIdempotencyAsync(idempotency, cancellationToken);

            if (replay is not null)
                return replay;
        }

        CoordinationResult coordination = await _coordinator.CreateRunAsync(request, cancellationToken);

        if (!coordination.Success)
        {
            string detail = string.Join("; ", coordination.Errors);

            await _baselineMutationAudit
                .RecordAsync(
                    AuditEventTypes.Architecture.RunFailed,
                    actor,
                    request.RequestId,
                    $"Coordination failed: {detail}",
                    cancellationToken);

            throw new InvalidOperationException(
                $"CreateRun failed: {detail}");
        }

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Creating architecture run: RunId={RunId}, RequestId={RequestId}, SystemName={SystemName}, Environment={Environment}",
                coordination.Run.RunId,
                request.RequestId,
                request.SystemName,
                request.Environment);
        }

        bool inserted;

        try
        {
            using TransactionScope scope = new(
                TransactionScopeOption.Required,
                TransactionScopeAsyncFlowOption.Enabled);
            inserted = await PersistCreateRunRowsAsync(
                request,
                coordination,
                idempotency,
                cancellationToken);

            if (inserted || idempotency is null)
                scope.Complete();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            await _baselineMutationAudit
                .RecordAsync(
                    AuditEventTypes.Architecture.RunFailed,
                    actor,
                    coordination.Run.RunId,
                    $"Persist failed: {ex.GetType().Name}",
                    cancellationToken);

            throw;
        }

        if (idempotency is not null && !inserted)
        {
            CreateRunResult? winner = await ResolveIdempotencyRaceAsync(idempotency, cancellationToken);

            if (winner is not null)
                return winner;

            throw new InvalidOperationException(
                "Idempotency insert failed but no winning row was found; retry the request.");
        }

        await _baselineMutationAudit
            .RecordAsync(
                AuditEventTypes.Architecture.RunCreated,
                actor,
                coordination.Run.RunId,
                $"RequestId={request.RequestId}; Environment={request.Environment}",
                cancellationToken);

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Architecture run created: RunId={RunId}, TaskCount={TaskCount}",
                coordination.Run.RunId,
                coordination.Tasks.Count);
        }

        return new CreateRunResult
        {
            Run = coordination.Run,
            EvidenceBundle = coordination.EvidenceBundle,
            Tasks = coordination.Tasks,
        };
    }

    private async Task<bool> PersistCreateRunRowsAsync(
        ArchitectureRequest request,
        CoordinationResult coordination,
        CreateRunIdempotencyState? idempotency,
        CancellationToken cancellationToken)
    {
        await _requestRepository.CreateAsync(request, cancellationToken);
        await _runRepository.CreateAsync(coordination.Run, cancellationToken);
        await _evidenceBundleRepository.CreateAsync(coordination.EvidenceBundle, cancellationToken);

        if (coordination.Tasks.Count > 0)
            await _taskRepository.CreateManyAsync(coordination.Tasks, cancellationToken);

        if (idempotency is null)
            return false;

        bool inserted = await _architectureRunIdempotencyRepository
            .TryInsertAsync(
                idempotency.TenantId,
                idempotency.WorkspaceId,
                idempotency.ProjectId,
                idempotency.IdempotencyKeyHash,
                idempotency.RequestFingerprint,
                coordination.Run.RunId,
                cancellationToken);

        if (!inserted)
        {
            _logger.LogInformation(
                "Idempotency insert did not win race for RunId={RunId}; SQL Server rolls back the ambient transaction when the scope is not completed.",
                coordination.Run.RunId);
        }

        return inserted;
    }

    private async Task<CreateRunResult?> TryReplayFromIdempotencyAsync(
        CreateRunIdempotencyState idempotency,
        CancellationToken cancellationToken)
    {
        ArchitectureRunIdempotencyLookup? existing = await _architectureRunIdempotencyRepository
            .TryGetAsync(
                idempotency.TenantId,
                idempotency.WorkspaceId,
                idempotency.ProjectId,
                idempotency.IdempotencyKeyHash,
                cancellationToken);

        if (existing is null)
            return null;

        if (!CryptographicOperations.FixedTimeEquals(existing.RequestFingerprint, idempotency.RequestFingerprint))
        {
            throw new ConflictException(
                "The Idempotency-Key was already used with a different request body.");
        }

        return await RehydrateCreateRunResultAsync(existing.RunId, cancellationToken);
    }

    private async Task<CreateRunResult?> ResolveIdempotencyRaceAsync(
        CreateRunIdempotencyState idempotency,
        CancellationToken cancellationToken)
    {
        ArchitectureRunIdempotencyLookup? winner = await _architectureRunIdempotencyRepository
            .TryGetAsync(
                idempotency.TenantId,
                idempotency.WorkspaceId,
                idempotency.ProjectId,
                idempotency.IdempotencyKeyHash,
                cancellationToken);

        if (winner is null)
            return null;

        if (!CryptographicOperations.FixedTimeEquals(winner.RequestFingerprint, idempotency.RequestFingerprint))
        {
            throw new ConflictException(
                "The Idempotency-Key was already used with a different request body.");
        }

        return await RehydrateCreateRunResultAsync(winner.RunId, cancellationToken);
    }

    private async Task<CreateRunResult> RehydrateCreateRunResultAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        ArchitectureRun run = await _runRepository.GetByIdAsync(runId, cancellationToken)
                              ?? throw new InvalidOperationException($"Run '{runId}' from idempotency store was not found.");

        IReadOnlyList<AgentTask> tasks = await _taskRepository.GetByRunIdAsync(runId, cancellationToken);

        if (tasks.Count == 0)
            throw new InvalidOperationException($"Idempotent run '{runId}' has no tasks.");

        string? bundleRef = tasks[0].EvidenceBundleRef;

        if (string.IsNullOrWhiteSpace(bundleRef))
            throw new InvalidOperationException($"Idempotent run '{runId}' is missing EvidenceBundleRef on the first task.");

        EvidenceBundle bundle = await _evidenceBundleRepository.GetByIdAsync(bundleRef, cancellationToken)
                                ?? throw new InvalidOperationException($"Evidence bundle '{bundleRef}' for idempotent run was not found.");

        _logger.LogInformation("CreateRun idempotent replay: RunId={RunId}, TaskCount={TaskCount}", runId, tasks.Count);

        return new CreateRunResult
        {
            Run = run,
            EvidenceBundle = bundle,
            Tasks = tasks.ToList(),
            IdempotentReplay = true,
        };
    }
}
