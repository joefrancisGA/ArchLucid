using System.Data;

using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlContextSnapshotRepository
{
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
}
