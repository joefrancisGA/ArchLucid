using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.ContextSnapshots;
using ArchLucid.Persistence.RelationalRead;
using ArchLucid.Persistence.Serialization;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     SQL Server-backed <see cref="IContextSnapshotRepository" /> with dual-write to legacy JSON columns
///     and relational child tables; reads use child tables only (empty collections when no rows).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class SqlContextSnapshotRepository(
    ISqlConnectionFactory connectionFactory,
    IScopeContextProvider scopeContextProvider) : IContextSnapshotRepository
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

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

    public async Task<ContextSnapshot?> GetByIdAsync(Guid snapshotId, CancellationToken ct)
    {
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        return await GetByIdAsync(snapshotId, connection, null, ct);
    }

    public async Task SaveAsync(
        ContextSnapshot snapshot,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        if (connection is not null)
        {
            await SaveCoreAsync(snapshot, connection, transaction, ct);
            return;
        }

        await using SqlConnection owned = await connectionFactory.CreateOpenConnectionAsync(ct);
        await using SqlTransaction tx = owned.BeginTransaction();

        try
        {
            await SaveCoreAsync(snapshot, owned, tx, ct);
            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    /// <summary>
    ///     Loads a snapshot using an existing connection (e.g. one-time JSON→relational backfill in a transaction).
    /// </summary>
    public async Task<ContextSnapshot?> GetByIdAsync(
        Guid snapshotId,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        const string sql = """
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
                           WHERE SnapshotId = @SnapshotId;
                           """;

        ContextSnapshotStorageRow? row = await connection.QuerySingleOrDefaultAsync<ContextSnapshotStorageRow>(
            new CommandDefinition(sql, new { SnapshotId = snapshotId }, transaction, cancellationToken: ct));

        if (row is null)
            return null;

        return await ContextSnapshotRelationalRead.HydrateAsync(connection, transaction, row, ct);
    }

    private async Task SaveCoreAsync(
        ContextSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        const string headerSql = """
                                 INSERT INTO dbo.ContextSnapshots
                                 (
                                     SnapshotId, RunId, ProjectId, TenantId, WorkspaceId, ScopeProjectId, CreatedUtc,
                                     CanonicalObjectsJson, DeltaSummary, WarningsJson, ErrorsJson, SourceHashesJson
                                 )
                                 VALUES
                                 (
                                     @SnapshotId, @RunId, @ProjectId, @TenantId, @WorkspaceId, @ScopeProjectId, @CreatedUtc,
                                     @CanonicalObjectsJson, @DeltaSummary, @WarningsJson, @ErrorsJson, @SourceHashesJson
                                 );
                                 """;

        object headerArgs = new
        {
            snapshot.SnapshotId,
            snapshot.RunId,
            snapshot.ProjectId,
            scope.TenantId,
            scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            snapshot.CreatedUtc,
            CanonicalObjectsJson = JsonEntitySerializer.Serialize(snapshot.CanonicalObjects),
            snapshot.DeltaSummary,
            WarningsJson = JsonEntitySerializer.Serialize(snapshot.Warnings),
            ErrorsJson = JsonEntitySerializer.Serialize(snapshot.Errors),
            SourceHashesJson = JsonEntitySerializer.Serialize(snapshot.SourceHashes)
        };

        await connection.ExecuteAsync(new CommandDefinition(headerSql, headerArgs, transaction, cancellationToken: ct))
            ;

        await InsertRelationalChildrenAsync(snapshot, connection, transaction, scope, ct);
    }

    private static async Task InsertRelationalChildrenAsync(
        ContextSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        ScopeContext scope,
        CancellationToken ct)
    {
        await InsertContextCanonicalRelationalAsync(snapshot, connection, transaction, scope, ct);
        await InsertContextWarningsRelationalAsync(snapshot, connection, transaction, scope, ct);
        await InsertContextErrorsRelationalAsync(snapshot, connection, transaction, scope, ct);
        await InsertContextSourceHashesRelationalAsync(snapshot, connection, transaction, scope, ct);
    }

    private static async Task InsertContextCanonicalRelationalAsync(
        ContextSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        ScopeContext scope,
        CancellationToken ct)
    {
        const string insertObjectSql = """
                                       INSERT INTO dbo.ContextSnapshotCanonicalObjects
                                       (
                                           CanonicalObjectRowId, SnapshotId, SortOrder,
                                           TenantId, WorkspaceId, ScopeProjectId,
                                           ObjectId, ObjectType, Name, SourceType, SourceId
                                       )
                                       VALUES
                                       (
                                           @CanonicalObjectRowId, @SnapshotId, @SortOrder,
                                           @TenantId, @WorkspaceId, @ScopeProjectId,
                                           @ObjectId, @ObjectType, @Name, @SourceType, @SourceId
                                       );
                                       """;

        const string insertPropertySql = """
                                         INSERT INTO dbo.ContextSnapshotCanonicalObjectProperties
                                         (CanonicalObjectRowId, PropertySortOrder, PropertyKey, PropertyValue, TenantId, WorkspaceId, ScopeProjectId)
                                         VALUES (@CanonicalObjectRowId, @PropertySortOrder, @PropertyKey, @PropertyValue, @TenantId, @WorkspaceId, @ScopeProjectId);
                                         """;
        for (int i = 0; i < snapshot.CanonicalObjects.Count; i++)
        {
            CanonicalObject obj = snapshot.CanonicalObjects[i];
            Guid rowId = Guid.NewGuid();

            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertObjectSql,
                    new
                    {
                        CanonicalObjectRowId = rowId,
                        snapshot.SnapshotId,
                        SortOrder = i,
                        scope.TenantId,
                        scope.WorkspaceId,
                        ScopeProjectId = scope.ProjectId,
                        obj.ObjectId,
                        obj.ObjectType,
                        obj.Name,
                        obj.SourceType,
                        obj.SourceId
                    },
                    transaction,
                    cancellationToken: ct));

            List<KeyValuePair<string, string>> orderedProps = obj.Properties
                .OrderBy(kv => kv.Key, StringComparer.Ordinal)
                .ToList();

            for (int p = 0; p < orderedProps.Count; p++)
            {
                KeyValuePair<string, string> kv = orderedProps[p];

                await connection.ExecuteAsync(
                    new CommandDefinition(
                        insertPropertySql,
                        new
                        {
                            CanonicalObjectRowId = rowId,
                            PropertySortOrder = p,
                            PropertyKey = kv.Key,
                            PropertyValue = kv.Value,
                            scope.TenantId,
                            scope.WorkspaceId,
                            ScopeProjectId = scope.ProjectId
                        },
                        transaction,
                        cancellationToken: ct));
            }
        }
    }

    private static async Task InsertContextWarningsRelationalAsync(
        ContextSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        ScopeContext scope,
        CancellationToken ct)
    {
        const string insertWarningSql = """
                                        INSERT INTO dbo.ContextSnapshotWarnings (
                                            SnapshotId, SortOrder, WarningText,
                                            TenantId, WorkspaceId, ScopeProjectId)
                                        VALUES (@SnapshotId, @SortOrder, @WarningText, @TenantId, @WorkspaceId, @ScopeProjectId);
                                        """;

        for (int w = 0; w < snapshot.Warnings.Count; w++)

            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertWarningSql,
                    new
                    {
                        snapshot.SnapshotId,
                        SortOrder = w,
                        WarningText = snapshot.Warnings[w],
                        scope.TenantId,
                        scope.WorkspaceId,
                        ScopeProjectId = scope.ProjectId
                    },
                    transaction,
                    cancellationToken: ct));
    }

    private static async Task InsertContextErrorsRelationalAsync(
        ContextSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        ScopeContext scope,
        CancellationToken ct)
    {
        const string insertErrorSql = """
                                      INSERT INTO dbo.ContextSnapshotErrors (
                                          SnapshotId, SortOrder, ErrorText,
                                          TenantId, WorkspaceId, ScopeProjectId)
                                      VALUES (@SnapshotId, @SortOrder, @ErrorText, @TenantId, @WorkspaceId, @ScopeProjectId);
                                      """;

        for (int e = 0; e < snapshot.Errors.Count; e++)

            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertErrorSql,
                    new
                    {
                        snapshot.SnapshotId,
                        SortOrder = e,
                        ErrorText = snapshot.Errors[e],
                        scope.TenantId,
                        scope.WorkspaceId,
                        ScopeProjectId = scope.ProjectId
                    },
                    transaction,
                    cancellationToken: ct));
    }

    private static async Task InsertContextSourceHashesRelationalAsync(
        ContextSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        ScopeContext scope,
        CancellationToken ct)
    {
        const string insertHashSql = """
                                     INSERT INTO dbo.ContextSnapshotSourceHashes (
                                         SnapshotId, SortOrder, SourceKey, HashValue,
                                         TenantId, WorkspaceId, ScopeProjectId)
                                     VALUES (@SnapshotId, @SortOrder, @SourceKey, @HashValue, @TenantId, @WorkspaceId, @ScopeProjectId);
                                     """;

        List<KeyValuePair<string, string>> orderedHashes = snapshot.SourceHashes
            .OrderBy(kv => kv.Key, StringComparer.Ordinal)
            .ToList();

        for (int h = 0; h < orderedHashes.Count; h++)
        {
            KeyValuePair<string, string> kv = orderedHashes[h];

            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertHashSql,
                    new
                    {
                        snapshot.SnapshotId,
                        SortOrder = h,
                        SourceKey = kv.Key,
                        HashValue = kv.Value,
                        scope.TenantId,
                        scope.WorkspaceId,
                        ScopeProjectId = scope.ProjectId
                    },
                    transaction,
                    cancellationToken: ct));
        }
    }

    /// <summary>
    ///     Inserts relational slices that are still empty while JSON columns contain data (idempotent per slice).
    /// </summary>
    internal static async Task BackfillRelationalSlicesAsync(
        ContextSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(connection);

        Guid snapshotId = snapshot.SnapshotId;

        int canonicalCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.ContextSnapshotCanonicalObjects WHERE SnapshotId = @SnapshotId",
            new { SnapshotId = snapshotId },
            ct);

        int warningsCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.ContextSnapshotWarnings WHERE SnapshotId = @SnapshotId",
            new { SnapshotId = snapshotId },
            ct);

        int errorsCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.ContextSnapshotErrors WHERE SnapshotId = @SnapshotId",
            new { SnapshotId = snapshotId },
            ct);

        int hashesCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.ContextSnapshotSourceHashes WHERE SnapshotId = @SnapshotId",
            new { SnapshotId = snapshotId },
            ct);

        bool needsRelationalSlices = (canonicalCount == 0 && snapshot.CanonicalObjects.Count > 0)
            || (warningsCount == 0 && snapshot.Warnings.Count > 0)
            || (errorsCount == 0 && snapshot.Errors.Count > 0)
            || (hashesCount == 0 && snapshot.SourceHashes.Count > 0);

        if (!needsRelationalSlices)
            return;

        const string scopeSql = """
                                SELECT
                                    COALESCE(cs.TenantId, r.TenantId) AS TenantId,
                                    COALESCE(cs.WorkspaceId, r.WorkspaceId) AS WorkspaceId,
                                    COALESCE(cs.ScopeProjectId, r.ScopeProjectId) AS ScopeProjectId
                                FROM dbo.ContextSnapshots AS cs
                                LEFT JOIN dbo.Runs AS r ON cs.RunId = r.RunId
                                WHERE cs.SnapshotId = @SnapshotId;
                                """;

        ContextSnapshotDenormScopeRow? scopeHdr =
            await connection.QuerySingleOrDefaultAsync<ContextSnapshotDenormScopeRow>(
                new CommandDefinition(scopeSql, new { SnapshotId = snapshotId }, transaction, cancellationToken: ct));

        if (scopeHdr?.TenantId is null || scopeHdr.WorkspaceId is null || scopeHdr.ScopeProjectId is null)
            throw new InvalidOperationException(
                $"dbo.ContextSnapshots row {snapshotId} (and Runs join fallback) lacks denormalized RLS scope; "
                + "cannot backfill ContextSnapshot relational children.");

        ScopeContext scopeFill = new()
        {
            TenantId = scopeHdr.TenantId!.Value,
            WorkspaceId = scopeHdr.WorkspaceId!.Value,
            ProjectId = scopeHdr.ScopeProjectId!.Value
        };

        if (canonicalCount == 0 && snapshot.CanonicalObjects.Count > 0)
            await InsertContextCanonicalRelationalAsync(snapshot, connection, transaction, scopeFill, ct);

        if (warningsCount == 0 && snapshot.Warnings.Count > 0)
            await InsertContextWarningsRelationalAsync(snapshot, connection, transaction, scopeFill, ct);

        if (errorsCount == 0 && snapshot.Errors.Count > 0)
            await InsertContextErrorsRelationalAsync(snapshot, connection, transaction, scopeFill, ct);

        if (hashesCount == 0 && snapshot.SourceHashes.Count > 0)
            await InsertContextSourceHashesRelationalAsync(snapshot, connection, transaction, scopeFill, ct);
    }

    private sealed record ContextSnapshotDenormScopeRow(Guid? TenantId, Guid? WorkspaceId, Guid? ScopeProjectId);
}
