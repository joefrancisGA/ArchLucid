namespace ArchiForge.Persistence.Retrieval;

/// <summary>
/// Queue for deferred retrieval indexing after an authority run commits (transactional outbox–style durability on SQL).
/// </summary>
public interface IRetrievalIndexingOutboxRepository
{
    /// <summary>Enqueues a run for background indexing (inserted after the authority UOW commits).</summary>
    Task EnqueueAsync(
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);

    /// <summary>Returns up to <paramref name="maxBatch"/> pending rows (unprocessed first).</summary>
    Task<IReadOnlyList<RetrievalIndexingOutboxEntry>> DequeuePendingAsync(int maxBatch, CancellationToken ct);

    /// <summary>Marks a row as processed so it is not returned again.</summary>
    Task MarkProcessedAsync(Guid outboxId, CancellationToken ct);
}
