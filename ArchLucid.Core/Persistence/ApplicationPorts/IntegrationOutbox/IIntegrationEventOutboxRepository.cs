using System.Data;

namespace ArchLucid.Persistence.IntegrationOutbox;

/// <summary>Transactional outbox for integration events (same pattern as <see cref="Retrieval.IRetrievalIndexingOutboxRepository"/>).</summary>
public interface IIntegrationEventOutboxRepository
{
    /// <param name="runId">Optional correlation to an authority run; null for governance-only, alert, or advisory events.</param>
    Task EnqueueAsync(
        Guid? runId,
        string eventType,
        string? messageId,
        ReadOnlyMemory<byte> payloadUtf8,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);

    /// <param name="runId">Optional correlation to an authority run; null when the event is not run-scoped.</param>
    Task EnqueueAsync(
        Guid? runId,
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

    /// <summary>Updates row after a failed publish (backoff or dead-letter).</summary>
    Task RecordPublishFailureAsync(
        Guid outboxId,
        int newRetryCount,
        DateTime? nextRetryUtc,
        DateTime? deadLetteredUtc,
        string? lastErrorMessage,
        CancellationToken ct);

    Task<long> CountIntegrationOutboxPublishPendingAsync(CancellationToken ct);

    Task<long> CountIntegrationOutboxDeadLetterAsync(CancellationToken ct);

    /// <param name="tenantId">When set, only rows for that tenant are returned; null lists across all tenants (host automation).</param>
    /// <param name="skip">Rows to skip for pagination (host DLQ auto-retry scans beyond the first page).</param>
    Task<IReadOnlyList<IntegrationEventOutboxDeadLetterRow>> ListDeadLettersAsync(
        int maxRows,
        Guid? tenantId,
        int skip,
        CancellationToken ct);

    /// <summary>Clears dead-letter state so the row is eligible for publish retries again.</summary>
    /// <param name="tenantId">When set, the row must belong to that tenant or the reset is a no-op.</param>
    Task<bool> ResetDeadLetterForRetryAsync(Guid outboxId, Guid? tenantId, CancellationToken ct);

    /// <summary>Marks a dead-letter row processed without republishing (operator suppress / acknowledge).</summary>
    /// <param name="tenantId">When set, the row must belong to that tenant or the acknowledge is a no-op.</param>
    Task<bool> AcknowledgeDeadLetterAsync(Guid outboxId, Guid? tenantId, CancellationToken ct);

    /// <summary>Re-queues dead-letter rows matching optional tenant and event-type filters.</summary>
    Task<IntegrationOutboxDeadLetterBulkRetryResult> RetryMatchingDeadLettersAsync(
        Guid? tenantId,
        string? eventType,
        int maxRows,
        CancellationToken ct);

    /// <summary>Loads a dead-lettered row including payload bytes for operator replay tooling.</summary>
    /// <param name="tenantId">When set, the row must belong to that tenant or null is returned.</param>
    Task<IntegrationEventOutboxEntry?> TryGetDeadLetterEntryAsync(Guid outboxId, Guid? tenantId, CancellationToken ct);
}
