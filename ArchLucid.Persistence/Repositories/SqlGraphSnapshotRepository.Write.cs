using System.Data;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.GraphSnapshots;
using ArchLucid.Persistence.Serialization;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlGraphSnapshotRepository
{
    public async Task SaveAsync(
        GraphSnapshot snapshot,
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
        GraphSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        const string headerSql = """
                                 INSERT INTO dbo.GraphSnapshots
                                 (
                                     GraphSnapshotId, ContextSnapshotId, RunId, CreatedUtc,
                                     TenantId, WorkspaceId, ScopeProjectId,
                                     NodesJson, EdgesJson, WarningsJson
                                 )
                                 VALUES
                                 (
                                     @GraphSnapshotId, @ContextSnapshotId, @RunId, @CreatedUtc,
                                     @TenantId, @WorkspaceId, @ScopeProjectId,
                                     @NodesJson, @EdgesJson, @WarningsJson
                                 );
                                 """;

        object headerArgs = new
        {
            snapshot.GraphSnapshotId,
            snapshot.ContextSnapshotId,
            snapshot.RunId,
            snapshot.CreatedUtc,
            scope.TenantId,
            scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            NodesJson = JsonEntitySerializer.Serialize(snapshot.Nodes),
            EdgesJson = JsonEntitySerializer.Serialize(snapshot.Edges),
            WarningsJson = JsonEntitySerializer.Serialize(snapshot.Warnings)
        };

        await connection.ExecuteAsync(new CommandDefinition(headerSql, headerArgs, transaction, cancellationToken: ct))
            ;

        await InsertNodesAndPropertiesAsync(snapshot, connection, transaction, scope, ct);
        await InsertWarningsAsync(snapshot, connection, transaction, scope, ct);
        await InsertIndexedEdgesAsync(connection, transaction, snapshot, scope, ct);
        await InsertEdgePropertiesAsync(snapshot, connection, transaction, scope, ct);
    }

    /// <summary>
    ///     Child-table writes use <see cref="Microsoft.Data.SqlClient.SqlBulkCopy" />; callers must supply a
    ///     <see cref="SqlConnection" />.
    /// </summary>
    private static SqlConnection RequireSqlConnection(IDbConnection connection)
    {
        if (connection is SqlConnection sqlConnection)
            return sqlConnection;

        throw new InvalidOperationException(
            "Graph snapshot persistence requires Microsoft.Data.SqlClient.SqlConnection for SqlBulkCopy on child tables. "
            + $"Received connection type '{connection.GetType().FullName ?? "(null)"}'.");
    }

    /// <summary>
    ///     When a transaction is supplied alongside bulk copy, it must be a SQL Client transaction on the same connection.
    /// </summary>
    private static SqlTransaction? RequireSqlTransactionOrNull(IDbTransaction? transaction)
    {
        if (transaction is null)
            return null;

        if (transaction is SqlTransaction sqlTransaction)
            return sqlTransaction;

        throw new InvalidOperationException(
            "Graph snapshot persistence requires Microsoft.Data.SqlClient.SqlTransaction when a transaction is supplied "
            + $"for SqlBulkCopy. Received transaction type '{transaction.GetType().FullName}'.");
    }

    private static async Task InsertNodesAndPropertiesAsync(
        GraphSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        ScopeContext scope,
        CancellationToken ct)
    {
        SqlConnection sqlConnection = RequireSqlConnection(connection);
        SqlTransaction? sqlTransaction = RequireSqlTransactionOrNull(transaction);

        List<(Guid RowId, GraphNode Node, int SortOrder)> planned = GraphSnapshotSqlBulkCopy.PlanNodeRows(snapshot);

        await GraphSnapshotSqlBulkCopy.CopyNodeRowsAsync(
            sqlConnection,
            sqlTransaction,
            snapshot,
            scope,
            planned,
            ct);
        await GraphSnapshotSqlBulkCopy.CopyNodePropertyRowsAsync(
            sqlConnection,
            sqlTransaction,
            scope,
            planned,
            ct);
    }

    private static async Task InsertWarningsAsync(
        GraphSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        ScopeContext scope,
        CancellationToken ct)
    {
        SqlConnection sqlConnection = RequireSqlConnection(connection);
        SqlTransaction? sqlTransaction = RequireSqlTransactionOrNull(transaction);

        await GraphSnapshotSqlBulkCopy.CopyWarningRowsAsync(
            sqlConnection,
            sqlTransaction,
            snapshot.GraphSnapshotId,
            snapshot.Warnings,
            scope,
            ct);
    }

    private static async Task InsertIndexedEdgesAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        GraphSnapshot snapshot,
        ScopeContext scope,
        CancellationToken ct)
    {
        SqlConnection sqlConnection = RequireSqlConnection(connection);
        SqlTransaction? sqlTransaction = RequireSqlTransactionOrNull(transaction);

        IReadOnlyList<GraphSnapshotEdgeRow> rows = GraphSnapshotEdgeIndexer.BuildRows(snapshot);

        await GraphSnapshotSqlBulkCopy.CopyIndexedEdgeRowsAsync(
            sqlConnection,
            sqlTransaction,
            rows,
            scope,
            ct);
    }

    private static Task InsertEdgePropertiesAsync(
        GraphSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        ScopeContext scope,
        CancellationToken ct)
    {
        SqlConnection sqlConnection = RequireSqlConnection(connection);
        SqlTransaction? sqlTransaction = RequireSqlTransactionOrNull(transaction);

        return GraphSnapshotSqlBulkCopy.CopyEdgePropertyRowsAsync(
            sqlConnection,
            sqlTransaction,
            snapshot,
            scope,
            ct);
    }
}
