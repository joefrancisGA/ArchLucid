using System.Text.Json;
using System.Diagnostics;
using System.Diagnostics.Metrics;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Persistence.ApplicationPorts.SecureNow;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.SecureNow;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.SecureNow;

public sealed class CollectionRunTriggerService(
    ICollectionRunRepository collectionRunRepository,
    ICollectionRunTrigger collectionRunTrigger,
    ICollectionRunTriggerIdempotencyStore idempotencyStore,
    IAuditService auditService,
    ICollectionRunAdmissionCounter admissionCounter,
    TimeProvider? timeProvider = null,
    ICollectionTriggerClaimRepository? durableClaims = null,
    IOptions<SecureNowCapacityOptions>? capacityOptions = null)
{
    private static readonly TimeSpan IdempotencyWindow = TimeSpan.FromMinutes(2);
    // Process-local execution bulkhead; independent of per-tenant idempotency gates.
    // Cross-replica capacity and idempotency require durable orchestration.
    private static readonly SemaphoreSlim ActiveTriggerSlots = new(8, 8);
    private static readonly Meter CapacityMeter = new("ArchLucid.SecureNow.CollectionCapacity");
    private static readonly Histogram<double> AdmissionWaitMs =
        CapacityMeter.CreateHistogram<double>("securenow.collection.admission_wait_ms", "ms");
    private static readonly Counter<long> TriggerAttempts =
        CapacityMeter.CreateCounter<long>("securenow.collection.trigger_attempts");
    // A fixed number of gates bounds coordination memory while allowing independent
    // tenants to trigger concurrently. This is a process-local optimization only;
    // distributed idempotency still requires a durable cross-replica claim.
    private static readonly SemaphoreSlim[] TriggerGates = Enumerable.Range(0, 64)
        .Select(_ => new SemaphoreSlim(1, 1)).ToArray();

    private readonly ICollectionRunRepository _collectionRunRepository =
        collectionRunRepository ?? throw new ArgumentNullException(nameof(collectionRunRepository));

    private readonly ICollectionRunTrigger _collectionRunTrigger =
        collectionRunTrigger ?? throw new ArgumentNullException(nameof(collectionRunTrigger));

    private readonly ICollectionRunTriggerIdempotencyStore _idempotencyStore =
        idempotencyStore ?? throw new ArgumentNullException(nameof(idempotencyStore));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ICollectionRunAdmissionCounter _admissionCounter =
        admissionCounter ?? throw new ArgumentNullException(nameof(admissionCounter));

    private readonly TimeProvider _timeProvider = timeProvider ?? TimeProvider.System;

    public async Task<CollectionRun> TriggerAsync(
        ScopeContext scope,
        string idempotencyKey,
        IReadOnlyList<string> subscriptionIds,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(idempotencyKey);
        ArgumentNullException.ThrowIfNull(subscriptionIds);

        SecureNowCapacityOptions limits = capacityOptions?.Value ?? new SecureNowCapacityOptions();
        limits.Validate();
        // A bounded number of callers may wait for either gate. Never reserve a
        // claim or invoke the external trigger until admitted.
        int waiting = _admissionCounter.IncrementWaiting();

        if (waiting > limits.MaxWaitingCollectionTriggers)
        {
            _admissionCounter.DecrementWaiting();
            throw new SecureNowCapacityExceededException();
        }

        using CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(limits.AdmissionTimeoutSeconds));
        CancellationToken admissionToken = timeout.Token;
        SemaphoreSlim triggerGate = TriggerGates[
            (int)((uint)scope.TenantId.GetHashCode() % (uint)TriggerGates.Length)];
        long started = Stopwatch.GetTimestamp();
        bool hasTenantGate = false;
        bool hasExecutionSlot = false;
        try
        {
            try
            {
                await triggerGate.WaitAsync(admissionToken);
                hasTenantGate = true;
                await ActiveTriggerSlots.WaitAsync(admissionToken);
                hasExecutionSlot = true;
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                throw new SecureNowCapacityExceededException();
            }
            // Waiting admission capacity is released as soon as execution starts.
            _admissionCounter.DecrementWaiting();
            waiting = 0;
            AdmissionWaitMs.Record(Stopwatch.GetElapsedTime(started).TotalMilliseconds);
            TriggerAttempts.Add(1);
            return await TriggerUnderGateAsync(scope, idempotencyKey, subscriptionIds, cancellationToken);
        }
        finally
        {
            if (hasExecutionSlot)
                ActiveTriggerSlots.Release();
            if (hasTenantGate)
                triggerGate.Release();
            if (waiting != 0)
                _admissionCounter.DecrementWaiting();
        }
    }

    [InformationalAudit]
    private async Task<CollectionRun> TriggerDurablyAsync(
        ScopeContext scope, string idempotencyKey,
        IReadOnlyList<string> subscriptionIds, CancellationToken cancellationToken)
    {
        ProjectScopeKey scoped = scope.ToProjectScopeKey();
        (bool acquired, Guid runId, byte _) = await durableClaims!.TryReserveAsync(
            scoped, idempotencyKey, Guid.NewGuid(), cancellationToken);

        if (!acquired)
        {
            // An external start may have succeeded before a crash. Never send another POST.
            CollectionRun? existing = await _collectionRunRepository.GetAsync(scope, runId, cancellationToken);
            if (existing is null)
                throw new InvalidOperationException(
                    "Collection trigger outcome awaits reconciliation; external work was not retried.");
            await durableClaims.ReconcilePersistedRunAsync(scoped, idempotencyKey, runId, cancellationToken);
            return existing;
        }

        // The reservation is committed before the external effect. A timeout/crash
        // leaves the claim pending and prevents automatic duplicate execution.
        CollectionRunTriggerResult started = await _collectionRunTrigger.TriggerAsync(
            scope,
            new CollectionRunTriggerRequest { RunId = runId, SubscriptionIds = subscriptionIds },
            cancellationToken);

        CollectionRun run = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runId,
            AgentVersion = "on-demand",
            Schedule = started.Schedule,
            StartedUtc = _timeProvider.GetUtcNow().UtcDateTime,
            Status = CollectionRunStatus.Running,
            SubscriptionsCoveredJson = JsonSerializer.Serialize(subscriptionIds),
        };
        await _collectionRunRepository.UpsertAsync(run, cancellationToken);
        await durableClaims.ReconcilePersistedRunAsync(scoped, idempotencyKey, runId, cancellationToken);
        await _auditService.LogAsync(new AuditEvent
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            EventType = AuditEventTypes.SecureNowCollectionRunTriggered,
            RunId = runId,
            DataJson = JsonSerializer.Serialize(new { runId, subscriptionIds, durableClaim = true }),
        }, cancellationToken);
        return run;
    }

    [InformationalAudit]
    private async Task<CollectionRun> TriggerUnderGateAsync(
        ScopeContext scope,
        string idempotencyKey,
        IReadOnlyList<string> subscriptionIds,
        CancellationToken cancellationToken)
    {
        string scopedKey = $"{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:{idempotencyKey.Trim()}";

        if (durableClaims is not null)
            return await TriggerDurablyAsync(scope, idempotencyKey.Trim(), subscriptionIds, cancellationToken);

        if (_idempotencyStore.TryGet(scopedKey, out Guid existingRunId))
        {
            CollectionRun? existingRun = await _collectionRunRepository.GetAsync(scope, existingRunId, cancellationToken);

            if (existingRun is not null)
            {
                return existingRun;
            }
        }

        Guid runId = Guid.NewGuid();
        CollectionRunTriggerRequest request = new()
        {
            RunId = runId,
            SubscriptionIds = subscriptionIds,
        };
        CollectionRunTriggerResult triggerResult = await _collectionRunTrigger.TriggerAsync(scope, request, cancellationToken);
        DateTime startedUtc = _timeProvider.GetUtcNow().UtcDateTime;
        CollectionRun run = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runId,
            AgentVersion = "on-demand",
            Schedule = triggerResult.Schedule,
            StartedUtc = startedUtc,
            Status = CollectionRunStatus.Running,
            SubscriptionsCoveredJson = JsonSerializer.Serialize(subscriptionIds),
        };

        await _collectionRunRepository.UpsertAsync(run, cancellationToken);
        _idempotencyStore.Set(scopedKey, runId, IdempotencyWindow);

        await _auditService.LogAsync(
            new AuditEvent
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                EventType = AuditEventTypes.SecureNowCollectionRunTriggered,
                RunId = runId,
                DataJson = JsonSerializer.Serialize(new
                {
                    runId,
                    subscriptionIds,
                    idempotencyWindowSeconds = IdempotencyWindow.TotalSeconds,
                }),
            },
            cancellationToken);

        return run;
    }
}
