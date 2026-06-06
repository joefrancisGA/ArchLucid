namespace ArchLucid.Host.Core.Coordination.Cosmos;

/// <summary>Drains <see cref="ArchLucid.Persistence.Cosmos.ICosmosGraphSnapshotOutboxRepository" /> after SQL commit.</summary>
public interface ICosmosGraphSnapshotOutboxProcessor
{
    Task ProcessPendingBatchAsync(CancellationToken cancellationToken = default);
}
