using System.Security.Cryptography;
using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.Runs.Orchestration;

/// <inheritdoc cref="IArchitectureRunBatchCreateOrchestrator" />
public sealed class ArchitectureRunBatchCreateOrchestrator(
    IArchitectureRunCreateOrchestrator architectureRunCreateOrchestrator,
    ICommitRunIdempotencyRepository commitRunIdempotencyRepository,
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IAuditService auditService) : IArchitectureRunBatchCreateOrchestrator
{
    private readonly IArchitectureRunCreateOrchestrator _architectureRunCreateOrchestrator =
        architectureRunCreateOrchestrator ?? throw new ArgumentNullException(nameof(architectureRunCreateOrchestrator));

    private readonly ICommitRunIdempotencyRepository _commitRunIdempotencyRepository =
        commitRunIdempotencyRepository ?? throw new ArgumentNullException(nameof(commitRunIdempotencyRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <inheritdoc />
    public async Task<BatchCreateRunOrchestrationResult> CreateBatchAsync(
        IReadOnlyList<ArchitectureRequest?> requests,
        CreateRunIdempotencyState? idempotency,
        string correlationId,
        CancellationToken cancellationToken = default)
    {
        if (requests is null)
            throw new ArgumentNullException(nameof(requests));

        if (idempotency is not null)
        {
            BatchCreateRunOrchestrationResult? replay =
                await TryResolveReplayAsync(idempotency, cancellationToken);

            if (replay is not null)
                return replay;
        }

        IReadOnlyList<BatchCreateRunItemOutcome> items = await CreateItemsAsync(requests, cancellationToken);

        if (idempotency is not null)
            await RecordBatchIdempotencyAsync(idempotency, cancellationToken);

        await LogBatchAcceptedAsync(requests.Count, items, correlationId, cancellationToken);

        return BatchCreateRunOrchestrationResult.Accepted(items);
    }

    private async Task<BatchCreateRunOrchestrationResult?> TryResolveReplayAsync(
        CreateRunIdempotencyState idempotency,
        CancellationToken cancellationToken)
    {
        CommitRunIdempotencyLookup? lookup = await _commitRunIdempotencyRepository.TryGetAsync(
            idempotency.TenantId,
            idempotency.WorkspaceId,
            idempotency.ProjectId,
            BuildBatchIdempotencyRunKey(idempotency),
            idempotency.IdempotencyKeyHash,
            cancellationToken);

        if (lookup is null)
            return null;

        // Fixed-time compare so a caller cannot probe stored fingerprints by timing repeated retries.
        if (!CryptographicOperations.FixedTimeEquals(lookup.RequestFingerprint, idempotency.RequestFingerprint))
            return BatchCreateRunOrchestrationResult.PayloadMismatch();

        return BatchCreateRunOrchestrationResult.Replayed();
    }

    private async Task<IReadOnlyList<BatchCreateRunItemOutcome>> CreateItemsAsync(
        IReadOnlyList<ArchitectureRequest?> requests,
        CancellationToken cancellationToken)
    {
        List<BatchCreateRunItemOutcome> items = new(requests.Count);

        foreach (ArchitectureRequest? request in requests)
        {
            items.Add(await CreateItemAsync(request, cancellationToken));
        }

        return items;
    }

    private async Task<BatchCreateRunItemOutcome> CreateItemAsync(
        ArchitectureRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return new BatchCreateRunItemOutcome
            {
                Succeeded = false,
                FailureKind = BatchCreateRunItemFailureKind.NullItem,
                ErrorMessage = "Null item in batch."
            };

        try
        {
            CreateRunResult result = await _architectureRunCreateOrchestrator
                .CreateRunAsync(request, idempotency: null, cancellationToken);

            return new BatchCreateRunItemOutcome
            {
                RequestId = request.RequestId,
                RunId = result.Run.RunId,
                Succeeded = true
            };
        }
        catch (ConflictException ex)
        {
            return FailedItem(request.RequestId, BatchCreateRunItemFailureKind.Conflict, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return FailedItem(request.RequestId, BatchCreateRunItemFailureKind.InvalidRequest, ex.Message);
        }
    }

    private static BatchCreateRunItemOutcome FailedItem(
        string? requestId,
        BatchCreateRunItemFailureKind failureKind,
        string errorMessage)
    {
        return new BatchCreateRunItemOutcome
        {
            RequestId = requestId,
            Succeeded = false,
            FailureKind = failureKind,
            ErrorMessage = errorMessage
        };
    }

    private Task RecordBatchIdempotencyAsync(
        CreateRunIdempotencyState idempotency,
        CancellationToken cancellationToken)
    {
        return _commitRunIdempotencyRepository.TryInsertAsync(
            idempotency.TenantId,
            idempotency.WorkspaceId,
            idempotency.ProjectId,
            BuildBatchIdempotencyRunKey(idempotency),
            idempotency.IdempotencyKeyHash,
            idempotency.RequestFingerprint,
            cancellationToken);
    }

    /// <summary>
    ///     Batch submissions have no run id, so they reserve a synthetic key in the per-run commit idempotency table.
    ///     The <c>batch_</c> prefix keeps them from ever colliding with a real run id.
    /// </summary>
    private static string BuildBatchIdempotencyRunKey(CreateRunIdempotencyState idempotency)
    {
        return "batch_" + Convert.ToBase64String(idempotency.IdempotencyKeyHash)[..16];
    }

    private async Task LogBatchAcceptedAsync(
        int submittedCount,
        IReadOnlyList<BatchCreateRunItemOutcome> items,
        string correlationId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = _actorContext.GetActor();
        int succeededCount = items.Count(static item => item.Succeeded);

        AuditEvent accepted = scope.CreateAuditEvent(
            AuditEventTypes.ArchitectureRunBatchAccepted,
            actor,
            actor,
            JsonSerializer.Serialize(
                new
                {
                    itemCount = submittedCount,
                    succeeded = succeededCount,
                    failed = submittedCount - succeededCount
                },
                AuditJsonSerializationOptions.Instance));
        accepted.CorrelationId = correlationId;

        await _auditService.LogAsync(accepted, cancellationToken);
    }
}
