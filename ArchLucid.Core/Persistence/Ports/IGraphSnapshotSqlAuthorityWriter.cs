using System.Data;

using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>
///     SQL-authority graph snapshot writes enlisted in <see cref="ArchLucid.Core.Transactions.IArchLucidUnitOfWork" />.
///     Separate from read-optimized <see cref="IGraphSnapshotRepository" /> when Cosmos polyglot overrides reads.
/// </summary>
public interface IGraphSnapshotSqlAuthorityWriter
{
    Task SaveAsync(
        GraphSnapshot snapshot,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);
}
