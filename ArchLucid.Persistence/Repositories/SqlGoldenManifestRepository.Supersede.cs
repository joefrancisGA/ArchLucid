using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.GoldenManifests;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlGoldenManifestRepository
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<Guid>> SupersedeUnreferencedActiveGoldenManifestsAsync(
        ScopeContext scope,
        Guid newManifestId,
        IDbConnection? connection,
        IDbTransaction? transaction,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (connection is not null)
            return await SupersedeUnreferencedActiveGoldenManifestsCoreAsync(scope, newManifestId, connection, transaction, cancellationToken);

        await using SqlConnection owned = await connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);
        await using SqlTransaction tx = owned.BeginTransaction();

        try
        {
            IReadOnlyList<Guid> superseded =
                await SupersedeUnreferencedActiveGoldenManifestsCoreAsync(scope, newManifestId, owned, tx, cancellationToken);
            tx.Commit();
            return superseded;
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    private static async Task<IReadOnlyList<Guid>> SupersedeUnreferencedActiveGoldenManifestsCoreAsync(
        ScopeContext scope,
        Guid newManifestId,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken cancellationToken)
    {
        IEnumerable<Guid> rows = await connection.QueryAsync<Guid>(
            new CommandDefinition(
                GoldenManifestWriteSql.SupersedeUnreferencedActive,
                GoldenManifestInsertParameters.ForSupersede(scope, newManifestId),
                transaction,
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        return rows.AsList();
    }
}
