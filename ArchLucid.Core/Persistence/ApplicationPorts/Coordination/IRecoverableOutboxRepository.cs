namespace ArchLucid.Core.Persistence.ApplicationPorts.Coordination;

/// <summary>
///     Lease/backoff/dead-letter port shared by recoverable SQL outbox processors (TB-920).
/// </summary>
public interface IRecoverableOutboxRepository<TEntry>
    where TEntry : IRecoverableOutboxEntry
{
    Task<IReadOnlyList<TEntry>> DequeuePendingAsync(
        int maxBatch,
        int leaseDurationSeconds,
        CancellationToken cancellationToken);

    Task MarkProcessedAsync(Guid outboxId, CancellationToken cancellationToken);

    Task RecordBackoffAfterProcessingFailureAsync(
        Guid outboxId,
        DateTime nextAttemptUtc,
        string failedAttemptErrorSummaryTruncatedTo400,
        CancellationToken cancellationToken);

    Task RecordDeadLetterAsync(
        Guid outboxId,
        string failedAttemptErrorSummaryTruncatedTo400,
        CancellationToken cancellationToken);
}
