using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Host.Core.Coordination.Cosmos;

/// <summary>
///     Loads graph snapshots from SQL for <see cref="CosmosGraphSnapshotOutboxProcessor" /> replication.
/// </summary>
public interface ICosmosGraphSnapshotOutboxSqlLoader
{
    Task<GraphSnapshot?> LoadAsync(ScopeContext scope, Guid graphSnapshotId, CancellationToken cancellationToken);
}
