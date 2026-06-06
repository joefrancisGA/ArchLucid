using System.Data;

namespace ArchLucid.Persistence.Cosmos;

/// <summary>
///     Transactional outbox for replicating SQL graph snapshots to Cosmos after the authority SQL unit of work commits.
/// </summary>
public interface ICosmosGraphSnapshotOutboxRepository
{
    Task EnqueueAsync(
        Guid graphSnapshotId,
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken = default);

    Task EnqueueAsync(
        Guid graphSnapshotId,
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IDbConnection connection,
        IDbTransaction transaction,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CosmosGraphSnapshotOutboxEntry>> DequeuePendingAsync(
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
}
