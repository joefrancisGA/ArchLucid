using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Host.Core.Coordination.Cosmos;

/// <summary>
///     Persists replicated graph snapshots to Cosmos for <see cref="CosmosGraphSnapshotOutboxProcessor" />.
/// </summary>
public interface ICosmosGraphSnapshotOutboxCosmosWriter
{
    Task SaveAsync(GraphSnapshot snapshot, CancellationToken cancellationToken);
}
