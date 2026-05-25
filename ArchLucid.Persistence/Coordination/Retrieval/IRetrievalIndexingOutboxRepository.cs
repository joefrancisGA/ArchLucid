using System.Data;

namespace ArchLucid.Persistence.Coordination.Retrieval;

/// <summary>
///     Queue for deferred retrieval indexing after an authority run commits (transactional outbox–style durability on
///     SQL).
/// </summary>
public interface IRetrievalIndexingOutboxRepository
{
    /// <summary>Enqueues a run for background indexing using a dedicated connection (non-transactional with authority UOW).</summary>
    Task EnqueueAsync(
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);

    /// <summary>
    ///     Enqueues inside an existing SQL transaction so the outbox row commits with the authority pipeline UOW.
    /// </summary>
    Task EnqueueAsync(
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IDbConnection connection,
        IDbTransaction transaction,
        CancellationToken ct);

    /// <summary>Returns up to <paramref name="maxBatch" /> actionable rows with an exclusive lease.</summary>
    Task<IReadOnlyList<RetrievalIndexingOutboxEntry>> DequeuePendingAsync(
        int maxBatch,
        int leaseDurationSeconds,
        CancellationToken ct);

    /// <summary>Marks a row as processed so it is not returned again.</summary>
    Task MarkProcessedAsync(Guid outboxId, CancellationToken ct);

    /// <summary>Records a transient failure, releases the lease, and schedules the next attempt.</summary>
    Task RecordBackoffAfterProcessingFailureAsync(
        Guid outboxId,
        DateTime nextAttemptUtc,
        string failedAttemptErrorSummaryTruncatedTo400,
        CancellationToken ct);

    /// <summary>Moves a row to dead-letter state after exhausting retries.</summary>
    Task RecordDeadLetterAsync(
        Guid outboxId,
        string failedAttemptErrorSummaryTruncatedTo400,
        CancellationToken ct);

    /// <summary>Count of unprocessed rows excluding dead letters (for observability / admin).</summary>
    Task<long> CountPendingAsync(CancellationToken ct);

    /// <summary>Count of rows in dead-letter state awaiting operator review.</summary>
    Task<long> CountDeadLetteredAsync(CancellationToken ct);
}
