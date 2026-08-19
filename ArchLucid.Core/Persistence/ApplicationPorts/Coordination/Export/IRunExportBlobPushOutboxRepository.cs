using ArchLucid.Core.Persistence.ApplicationPorts.Coordination;

namespace ArchLucid.Persistence.Coordination.Export;

/// <summary>
///     Queue for deferred run-export blob push after an operator enqueues a destination SAS URL (durable outbox).
/// </summary>
public interface IRunExportBlobPushOutboxRepository : IRecoverableOutboxRepository<RunExportBlobPushOutboxEntry>
{
    /// <summary>Enqueues a run export push using a dedicated connection (non-transactional with authority UOW).</summary>
    Task EnqueueAsync(
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string destinationSasUrl,
        CancellationToken ct);

    /// <summary>Count of unprocessed rows excluding dead letters (for observability / admin).</summary>
    Task<long> CountPendingAsync(CancellationToken ct);

    /// <summary>Count of rows in dead-letter state awaiting operator review.</summary>
    Task<long> CountDeadLetteredAsync(CancellationToken ct);
}
