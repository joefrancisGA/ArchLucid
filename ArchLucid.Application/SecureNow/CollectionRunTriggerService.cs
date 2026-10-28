using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Persistence.ApplicationPorts.SecureNow;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.SecureNow;

namespace ArchLucid.Application.SecureNow;

public sealed class CollectionRunTriggerService(
    ICollectionRunRepository collectionRunRepository,
    ICollectionRunTrigger collectionRunTrigger,
    ICollectionRunTriggerIdempotencyStore idempotencyStore,
    IAuditService auditService) 
{
    private static readonly TimeSpan IdempotencyWindow = TimeSpan.FromMinutes(2);
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

    public async Task<CollectionRun> TriggerAsync(
        ScopeContext scope,
        string idempotencyKey,
        IReadOnlyList<string> subscriptionIds,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(idempotencyKey);
        ArgumentNullException.ThrowIfNull(subscriptionIds);

        SemaphoreSlim triggerGate = TriggerGates[
            (int)((uint)scope.TenantId.GetHashCode() % (uint)TriggerGates.Length)];
        await triggerGate.WaitAsync(cancellationToken);

        try
        {
            return await TriggerUnderGateAsync(scope, idempotencyKey, subscriptionIds, cancellationToken);
        }
        finally
        {
            triggerGate.Release();
        }
    }

    [InformationalAudit]
    private async Task<CollectionRun> TriggerUnderGateAsync(
        ScopeContext scope,
        string idempotencyKey,
        IReadOnlyList<string> subscriptionIds,
        CancellationToken cancellationToken)
    {
        string scopedKey = $"{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:{idempotencyKey.Trim()}";

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
        DateTime startedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;
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
