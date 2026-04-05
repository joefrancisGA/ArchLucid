using System.Data;

namespace ArchiForge.Persistence.Integration;

/// <summary>In-memory outbox for tests and <c>StorageProvider=InMemory</c>.</summary>
public sealed class InMemoryIntegrationEventOutboxRepository : IIntegrationEventOutboxRepository
{
    private readonly List<IntegrationEventOutboxEntry> _pending = [];
    private readonly object _gate = new();

    /// <inheritdoc />
    public Task EnqueueAsync(
        Guid runId,
        string eventType,
        string? messageId,
        ReadOnlyMemory<byte> payloadUtf8,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        return EnqueueCoreAsync(runId, eventType, messageId, payloadUtf8, tenantId, workspaceId, projectId, ct);
    }

    /// <inheritdoc />
    public Task EnqueueAsync(
        Guid runId,
        string eventType,
        string? messageId,
        ReadOnlyMemory<byte> payloadUtf8,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IDbConnection connection,
        IDbTransaction transaction,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(transaction);

        return EnqueueCoreAsync(runId, eventType, messageId, payloadUtf8, tenantId, workspaceId, projectId, ct);
    }

    private Task EnqueueCoreAsync(
        Guid runId,
        string eventType,
        string? messageId,
        ReadOnlyMemory<byte> payloadUtf8,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        IntegrationEventOutboxEntry entry = new()
        {
            OutboxId = Guid.NewGuid(),
            RunId = runId,
            EventType = eventType,
            MessageId = messageId,
            PayloadUtf8 = payloadUtf8.ToArray(),
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            CreatedUtc = DateTime.UtcNow
        };

        lock (_gate)
        {
            _pending.Add(entry);
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<IntegrationEventOutboxEntry>> DequeuePendingAsync(int maxBatch, CancellationToken ct)
    {
        int take = Math.Clamp(maxBatch, 1, 100);

        lock (_gate)
        {
            List<IntegrationEventOutboxEntry> batch = _pending
                .OrderBy(e => e.CreatedUtc)
                .Take(take)
                .ToList();

            return Task.FromResult<IReadOnlyList<IntegrationEventOutboxEntry>>(batch);
        }
    }

    /// <inheritdoc />
    public Task MarkProcessedAsync(Guid outboxId, CancellationToken ct)
    {
        lock (_gate)
        {
            _pending.RemoveAll(e => e.OutboxId == outboxId);
        }

        return Task.CompletedTask;
    }
}
