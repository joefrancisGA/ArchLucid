using System.Data;

using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Scoping;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.ContextSnapshots;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.RelationalRead;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlContextSnapshotRepository
{
    public async Task<ContextSnapshot?> GetLatestAsync(string projectId, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(projectId);

        const string sql = """
                           SELECT TOP 1
                               SnapshotId,
                               RunId,
                               ProjectId,
                               CreatedUtc,
                               CanonicalObjectsJson,
                               DeltaSummary,
                               WarningsJson,
                               ErrorsJson,
                               SourceHashesJson
                           FROM dbo.ContextSnapshots
                           WHERE ProjectId = @ProjectId
                           ORDER BY CreatedUtc DESC;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        ContextSnapshotStorageRow? row = await connection.QuerySingleOrDefaultAsync<ContextSnapshotStorageRow>(
            new CommandDefinition(sql, new { ProjectId = projectId }, cancellationToken: ct));

        if (row is null)
            return null;

        return await ContextSnapshotRelationalRead.HydrateAsync(connection, null, row, ct);
    }

    public async Task<ContextSnapshot?> GetByIdAsync(ReadScopeTriple scope, Guid snapshotId, CancellationToken ct)
    {
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        return await GetByIdAsync(ToScopeContext(scope), snapshotId, connection, null, ct);
    }

    /// <summary>
    ///     Loads a snapshot using an existing connection (e.g. one-time JSON→relational backfill in a transaction).
    /// </summary>
    public async Task<ContextSnapshot?> GetByIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        string sql = """
                     SELECT
                         SnapshotId,
                         RunId,
                         ProjectId,
                         CreatedUtc,
                         CanonicalObjectsJson,
                         DeltaSummary,
                         WarningsJson,
                         ErrorsJson,
                         SourceHashesJson
                     FROM dbo.ContextSnapshots
                     WHERE SnapshotId = @SnapshotId
                     """ + PersistenceTenantScope.AndScopeProjectIdTripleWhere(scope) + ";";

        DynamicParameters parameters = new();
        parameters.Add("SnapshotId", snapshotId);
        PersistenceTenantScope.AddScopeTripleIfNeeded(parameters, scope);

        ContextSnapshotStorageRow? row = await connection.QuerySingleOrDefaultAsync<ContextSnapshotStorageRow>(
            new CommandDefinition(sql, parameters, transaction, cancellationToken: ct));

        if (row is null)
            return null;

        return await ContextSnapshotRelationalRead.HydrateAsync(connection, transaction, row, ct);
    }
}
