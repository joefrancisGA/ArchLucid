namespace ArchLucid.Persistence.Admin;

/// <summary>Single round-trip read of operator outbox depths for admin dashboards.</summary>
public interface IAdminOutboxSnapshotReader
{
    Task<AdminOutboxSnapshotCounts> ReadAsync(CancellationToken cancellationToken = default);
}

/// <summary>Pending and dead-letter depths aligned with legacy per-repository count SQL.</summary>
public sealed record AdminOutboxSnapshotCounts(
    long AuthorityPipelineWorkPending,
    long AuthorityPipelineWorkDeadLetter,
    long RetrievalIndexingPending,
    long IntegrationEventOutboxPublishPending,
    long IntegrationEventOutboxDeadLetter);
