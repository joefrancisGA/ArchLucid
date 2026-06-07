namespace ArchLucid.Persistence.Coordination.Projection;

/// <summary>
///     Durable queue for post-commit projection side effects previously invoked via <c>Task.Run</c> (TB-309).
/// </summary>
public interface IPostCommitProjectionOutboxRepository
{
    /// <summary>Enqueues one post-commit projection row (non-transactional with authority UOW).</summary>
    Task EnqueueAsync(
        string workType,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid? runId,
        string? payloadJson,
        CancellationToken ct);

    /// <summary>Returns up to <paramref name="maxBatch" /> actionable rows with an exclusive lease.</summary>
    Task<IReadOnlyList<PostCommitProjectionOutboxEntry>> DequeuePendingAsync(
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
