using System.Data;

using ArchLucid.Core.Persistence.ApplicationPorts.Coordination;

namespace ArchLucid.Persistence.Orchestration;

/// <summary>Transactional-style queue for deferred authority pipeline continuation after the run header commits.</summary>
public interface IAuthorityPipelineWorkRepository : IRecoverableOutboxRepository<AuthorityPipelineWorkOutboxEntry>
{
    Task EnqueueAsync(
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string payloadJson,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Enqueues inside an existing SQL transaction so the outbox row commits with the authority run header UOW.
    /// </summary>
    Task EnqueueAsync(
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string payloadJson,
        IDbConnection connection,
        IDbTransaction transaction,
        CancellationToken cancellationToken = default);

    /// <summary>Rows awaiting completion (excluding dead-letter rows).</summary>
    Task<long> CountPendingAsync(CancellationToken cancellationToken = default);

    /// <summary>Rows eligible for dequeue right now (mirrors dequeue filter).</summary>
    Task<long> CountActionablePendingAsync(CancellationToken cancellationToken = default);

    /// <summary>Unprocessed poison rows promoted after retry exhaustion.</summary>
    Task<long> CountDeadLetteredAsync(CancellationToken cancellationToken = default);
}
