namespace ArchLucid.Persistence.Coordination.Export;

/// <summary>
///     Queue for deferred run-export blob push after an operator enqueues a destination SAS URL (durable outbox).
/// </summary>
public interface IRunExportBlobPushOutboxRepository
{
    /// <summary>Enqueues a run export push using a dedicated connection (non-transactional with authority UOW).</summary>
    Task EnqueueAsync(
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string destinationSasUrl,
        CancellationToken ct);

    /// <summary>Returns up to <paramref name="maxBatch" /> actionable rows with an exclusive lease.</summary>
    Task<IReadOnlyList<RunExportBlobPushOutboxEntry>> DequeuePendingAsync(
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
