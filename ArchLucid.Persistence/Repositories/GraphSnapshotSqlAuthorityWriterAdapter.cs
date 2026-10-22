using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;

namespace ArchLucid.Persistence.Repositories;

/// <summary>Forwards enlisted graph writes to the active <see cref="IGraphSnapshotRepository" /> (InMemory hosts).</summary>
public sealed class GraphSnapshotSqlAuthorityWriterAdapter(IGraphSnapshotRepository inner) : IGraphSnapshotSqlAuthorityWriter
{
    private readonly IGraphSnapshotRepository _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public Task SaveAsync(
        GraphSnapshot snapshot,
        CancellationToken ct,
        System.Data.IDbConnection? connection = null,
        System.Data.IDbTransaction? transaction = null) =>
        _inner.SaveAsync(snapshot, ct, connection, transaction);
}
