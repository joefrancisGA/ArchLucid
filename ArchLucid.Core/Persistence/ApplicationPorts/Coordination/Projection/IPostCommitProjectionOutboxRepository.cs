using ArchLucid.Core.Persistence.ApplicationPorts.Coordination;

namespace ArchLucid.Persistence.Coordination.Projection;

/// <summary>
///     Durable queue for post-commit projection side effects previously invoked via <c>Task.Run</c> (TB-309).
/// </summary>
public interface IPostCommitProjectionOutboxRepository : IRecoverableOutboxRepository<PostCommitProjectionOutboxEntry>
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

    /// <summary>Count of unprocessed rows excluding dead letters (for observability / admin).</summary>
    Task<long> CountPendingAsync(CancellationToken ct);

    /// <summary>Count of rows in dead-letter state awaiting operator review.</summary>
    Task<long> CountDeadLetteredAsync(CancellationToken ct);
}
