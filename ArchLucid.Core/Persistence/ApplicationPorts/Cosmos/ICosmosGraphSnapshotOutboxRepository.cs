using System.Data;

using ArchLucid.Core.Persistence.ApplicationPorts.Coordination;

namespace ArchLucid.Persistence.Cosmos;

/// <summary>
///     Transactional outbox for replicating SQL graph snapshots to Cosmos after the authority SQL unit of work commits.
/// </summary>
public interface ICosmosGraphSnapshotOutboxRepository : IRecoverableOutboxRepository<CosmosGraphSnapshotOutboxEntry>
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
}
