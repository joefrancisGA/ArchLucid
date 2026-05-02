namespace ArchLucid.Persistence.Orchestration;

/// <summary>Transactional-style queue for deferred authority pipeline continuation after the run header commits.</summary>
public interface IAuthorityPipelineWorkRepository
{
    Task EnqueueAsync(
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string payloadJson,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Claims up to <paramref name="maxBatch" /> actionable rows under an exclusive <paramref name="leaseDurationSeconds"/> lease.
    /// </summary>
    Task<IReadOnlyList<AuthorityPipelineWorkOutboxEntry>> DequeuePendingAsync(
        int maxBatch,
        int leaseDurationSeconds,
        CancellationToken cancellationToken = default);

    Task MarkProcessedAsync(Guid outboxId, CancellationToken cancellationToken = default);

    Task RecordBackoffAfterProcessingFailureAsync(
        Guid outboxId,
        DateTime nextAttemptUtc,
        string failedAttemptErrorSummaryTruncatedTo400,
        CancellationToken cancellationToken = default);

    Task RecordDeadLetterAsync(
        Guid outboxId,
        string failedAttemptErrorSummaryTruncatedTo400,
        CancellationToken cancellationToken = default);

    /// <summary>Rows awaiting completion (excluding dead-letter rows).</summary>
    Task<long> CountPendingAsync(CancellationToken cancellationToken = default);

    /// <summary>Rows eligible for dequeue right now (mirrors dequeue filter).</summary>
    Task<long> CountActionablePendingAsync(CancellationToken cancellationToken = default);

    /// <summary>Unprocessed poison rows promoted after retry exhaustion.</summary>
    Task<long> CountDeadLetteredAsync(CancellationToken cancellationToken = default);
}
