using System.Data;

namespace ArchiForge.Persistence.Integration;

/// <summary>Transactional outbox for integration events (same pattern as <see cref="Retrieval.IRetrievalIndexingOutboxRepository"/>).</summary>
public interface IIntegrationEventOutboxRepository
{
    Task EnqueueAsync(
        Guid runId,
        string eventType,
        string? messageId,
        ReadOnlyMemory<byte> payloadUtf8,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);

    Task EnqueueAsync(
        Guid runId,
        string eventType,
        string? messageId,
        ReadOnlyMemory<byte> payloadUtf8,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IDbConnection connection,
        IDbTransaction transaction,
        CancellationToken ct);

    Task<IReadOnlyList<IntegrationEventOutboxEntry>> DequeuePendingAsync(int maxBatch, CancellationToken ct);

    Task MarkProcessedAsync(Guid outboxId, CancellationToken ct);
}
