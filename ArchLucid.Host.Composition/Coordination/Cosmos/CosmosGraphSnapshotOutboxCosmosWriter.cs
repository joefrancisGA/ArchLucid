using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Host.Core.Coordination.Cosmos;
using ArchLucid.Persistence.Cosmos;

namespace ArchLucid.Host.Composition.Coordination.Cosmos;

/// <inheritdoc cref="ICosmosGraphSnapshotOutboxCosmosWriter" />
public sealed class CosmosGraphSnapshotOutboxCosmosWriter(CosmosGraphSnapshotRepository cosmosGraphSnapshots)
    : ICosmosGraphSnapshotOutboxCosmosWriter
{
    private readonly CosmosGraphSnapshotRepository _cosmosGraphSnapshots =
        cosmosGraphSnapshots ?? throw new ArgumentNullException(nameof(cosmosGraphSnapshots));

    /// <inheritdoc />
    public Task SaveAsync(GraphSnapshot snapshot, CancellationToken cancellationToken) =>
        _cosmosGraphSnapshots.SaveAsync(snapshot, cancellationToken);
}
