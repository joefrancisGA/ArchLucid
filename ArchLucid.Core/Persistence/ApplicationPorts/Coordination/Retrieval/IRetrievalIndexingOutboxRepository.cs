using System.Data;

using ArchLucid.Core.Persistence.ApplicationPorts.Coordination;

namespace ArchLucid.Persistence.Coordination.Retrieval;

/// <summary>
///     Queue for deferred retrieval indexing after an authority run commits (transactional outbox–style durability on
///     SQL).
/// </summary>
public interface IRetrievalIndexingOutboxRepository : IRecoverableOutboxRepository<RetrievalIndexingOutboxEntry>
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

    /// <summary>Count of unprocessed rows excluding dead letters (for observability / admin).</summary>
    Task<long> CountPendingAsync(CancellationToken ct);

    /// <summary>Count of rows in dead-letter state awaiting operator review.</summary>
    Task<long> CountDeadLetteredAsync(CancellationToken ct);
}
