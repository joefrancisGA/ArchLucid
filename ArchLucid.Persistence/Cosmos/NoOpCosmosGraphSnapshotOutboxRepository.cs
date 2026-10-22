using System.Data;

namespace ArchLucid.Persistence.Cosmos;

/// <summary>No-op outbox for InMemory storage and tests when Cosmos graph replication is unused.</summary>
public sealed class NoOpCosmosGraphSnapshotOutboxRepository : ICosmosGraphSnapshotOutboxRepository
{
    /// <inheritdoc />
    public Task EnqueueAsync(
        Guid graphSnapshotId,
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    /// <inheritdoc />
    public Task EnqueueAsync(
        Guid graphSnapshotId,
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IDbConnection connection,
        IDbTransaction transaction,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    /// <inheritdoc />
    public Task<IReadOnlyList<CosmosGraphSnapshotOutboxEntry>> DequeuePendingAsync(
        int maxBatch,
        int leaseDurationSeconds,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<CosmosGraphSnapshotOutboxEntry>>([]);

    /// <inheritdoc />
    public Task MarkProcessedAsync(Guid outboxId, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    /// <inheritdoc />
    public Task RecordBackoffAfterProcessingFailureAsync(
        Guid outboxId,
        DateTime nextAttemptUtc,
        string failedAttemptErrorSummaryTruncatedTo400,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    /// <inheritdoc />
    public Task RecordDeadLetterAsync(
        Guid outboxId,
        string failedAttemptErrorSummaryTruncatedTo400,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
