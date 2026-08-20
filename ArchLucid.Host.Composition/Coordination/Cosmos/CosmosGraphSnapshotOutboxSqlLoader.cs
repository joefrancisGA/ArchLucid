using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Coordination.Cosmos;
using ArchLucid.Persistence.Repositories;

namespace ArchLucid.Host.Composition.Coordination.Cosmos;

/// <inheritdoc cref="ICosmosGraphSnapshotOutboxSqlLoader" />
public sealed class CosmosGraphSnapshotOutboxSqlLoader(SqlGraphSnapshotRepository sqlGraphSnapshots)
    : ICosmosGraphSnapshotOutboxSqlLoader
{
    private readonly SqlGraphSnapshotRepository _sqlGraphSnapshots =
        sqlGraphSnapshots ?? throw new ArgumentNullException(nameof(sqlGraphSnapshots));

    /// <inheritdoc />
    public Task<GraphSnapshot?> LoadAsync(ScopeContext scope, Guid graphSnapshotId, CancellationToken cancellationToken) =>
        _sqlGraphSnapshots.GetByIdAsync(scope, graphSnapshotId, cancellationToken);
}
