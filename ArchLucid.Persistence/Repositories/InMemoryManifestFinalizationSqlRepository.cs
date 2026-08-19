using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     In-memory stub; SQL finalization is not used when <see cref="Core.Transactions.IArchLucidUnitOfWork.SupportsExternalTransaction" /> is false.
/// </summary>
public sealed class InMemoryManifestFinalizationSqlRepository : IManifestFinalizationSqlRepository
{
    /// <inheritdoc />
    public Task<ManifestFinalizationLockedRunRow?> LockRunForFinalizationAsync(
        ScopeContext scope,
        Guid runId,
        IDbConnection connection,
        IDbTransaction transaction,
        CancellationToken cancellationToken) =>
        throw new NotSupportedException("SQL manifest finalization is unavailable in in-memory storage mode.");

    /// <inheritdoc />
    public Task ExecuteFinalizeProcedureAsync(
        ManifestFinalizationProcedureRequest request,
        IDbConnection connection,
        IDbTransaction transaction,
        CancellationToken cancellationToken) =>
        throw new NotSupportedException("SQL manifest finalization is unavailable in in-memory storage mode.");
}
