using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.GraphSnapshots;
using ArchLucid.Persistence.RelationalRead;
using ArchLucid.Persistence.Serialization;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     SQL Server-backed implementation of <see cref="IGraphSnapshotRepository" />.
///     Dual-writes legacy JSON on <c>dbo.GraphSnapshots</c> plus relational children; reads prefer child rows per
///     collection.
///     <c>dbo.GraphSnapshotEdges</c> remains authoritative for indexed edge listing in repository helpers
///     (same query and ordering).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class SqlGraphSnapshotRepository(
    ISqlConnectionFactory connectionFactory,
    IScopeContextProvider scopeContextProvider) : IGraphSnapshotRepository
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

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

    public async Task<GraphSnapshot?> GetByIdAsync(Guid graphSnapshotId, CancellationToken ct)
    {
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        return await GetByIdAsync(graphSnapshotId, connection, null, ct);
    }

    public async Task<GraphSnapshot?> GetLatestByContextSnapshotIdAsync(Guid contextSnapshotId, CancellationToken ct)
    {
        const string sql = """
                           SELECT TOP 1
                               GraphSnapshotId, ContextSnapshotId, RunId, CreatedUtc
                           FROM dbo.GraphSnapshots
                           WHERE ContextSnapshotId = @ContextSnapshotId
                           ORDER BY CreatedUtc DESC;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        GraphSnapshotRelationalRead.GraphSnapshotHeaderRow? header =
            await connection.QuerySingleOrDefaultAsync<GraphSnapshotRelationalRead.GraphSnapshotHeaderRow>(
                new CommandDefinition(
                    sql,
                    new { ContextSnapshotId = contextSnapshotId },
                    cancellationToken: ct));

        if (header is null)
            return null;

        return await GraphSnapshotRelationalRead.HydrateAsync(connection, null, header, jsonRowForMerge: null, ct);
    }

    public async Task<IReadOnlyList<GraphSnapshotIndexedEdge>> ListIndexedEdgesAsync(Guid graphSnapshotId,
        CancellationToken ct)
    {
        const string sql = """
                           SELECT EdgeId, FromNodeId, ToNodeId, EdgeType, Weight
                           FROM dbo.GraphSnapshotEdges
                           WHERE GraphSnapshotId = @GraphSnapshotId
                           ORDER BY EdgeId;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<IndexedEdgeRow> rows = await connection.QueryAsync<IndexedEdgeRow>(
            new CommandDefinition(
                sql,
                new { GraphSnapshotId = graphSnapshotId },
                cancellationToken: ct));

        return rows
            .Select(r => new GraphSnapshotIndexedEdge(r.EdgeId, r.FromNodeId, r.ToNodeId, r.EdgeType, r.Weight))
            .ToList();
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

    private static async Task InsertNodesAndPropertiesAsync(
        GraphSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        ScopeContext scope,
        CancellationToken ct)
    {
        List<(Guid RowId, GraphNode Node, int SortOrder)> planned =
            GraphSnapshotSqlBulkInsert.PlanNodeRows(snapshot);

        await GraphSnapshotSqlBulkInsert.InsertNodeRowsAsync(
            snapshot,
            connection,
            transaction,
            scope,
            planned,
            ct);
        await GraphSnapshotSqlBulkInsert.InsertNodePropertyRowsAsync(
            connection,
            transaction,
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
        const string insertWarningSql = """
                                        INSERT INTO dbo.GraphSnapshotWarnings (
                                            GraphSnapshotId, SortOrder, WarningText, TenantId, WorkspaceId, ScopeProjectId)
                                        VALUES (@GraphSnapshotId, @SortOrder, @WarningText, @TenantId, @WorkspaceId, @ScopeProjectId);
                                        """;

        for (int w = 0; w < snapshot.Warnings.Count; w++)

            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertWarningSql,
                    new
                    {
                        snapshot.GraphSnapshotId,
                        SortOrder = w,
                        WarningText = snapshot.Warnings[w],
                        scope.TenantId,
                        scope.WorkspaceId,
                        ScopeProjectId = scope.ProjectId
                    },
                    transaction,
                    cancellationToken: ct));
    }

    private static async Task InsertIndexedEdgesAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        GraphSnapshot snapshot,
        ScopeContext scope,
        CancellationToken ct)
    {
        IReadOnlyList<GraphSnapshotEdgeRow> rows = GraphSnapshotEdgeIndexer.BuildRows(snapshot);

        if (rows.Count == 0)
            return;

        const string edgeSql = """
                               INSERT INTO dbo.GraphSnapshotEdges (
                                   GraphSnapshotId, EdgeId, FromNodeId, ToNodeId, EdgeType, Weight,
                                   TenantId, WorkspaceId, ScopeProjectId)
                               VALUES (
                                   @GraphSnapshotId, @EdgeId, @FromNodeId, @ToNodeId, @EdgeType, @Weight,
                                   @TenantId, @WorkspaceId, @ScopeProjectId);
                               """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                edgeSql,
                rows.Select(r => new
                {
                    r.GraphSnapshotId,
                    r.EdgeId,
                    r.FromNodeId,
                    r.ToNodeId,
                    r.EdgeType,
                    r.Weight,
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId
                }),
                transaction,
                cancellationToken: ct));
    }

    private static Task InsertEdgePropertiesAsync(
        GraphSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        ScopeContext scope,
        CancellationToken ct) =>
        GraphSnapshotSqlBulkInsert.InsertEdgePropertyRowsAsync(snapshot, connection, transaction, scope, ct);

    /// <inheritdoc cref="GetByIdAsync(System.Guid,System.Threading.CancellationToken)" />
    public async Task<GraphSnapshot?> GetByIdAsync(
        Guid graphSnapshotId,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        const string sql = """
                           SELECT
                               GraphSnapshotId, ContextSnapshotId, RunId, CreatedUtc
                           FROM dbo.GraphSnapshots
                           WHERE GraphSnapshotId = @GraphSnapshotId;
                           """;

        GraphSnapshotRelationalRead.GraphSnapshotHeaderRow? header =
            await connection.QuerySingleOrDefaultAsync<GraphSnapshotRelationalRead.GraphSnapshotHeaderRow>(
                new CommandDefinition(
                    sql,
                    new { GraphSnapshotId = graphSnapshotId },
                    transaction,
                    cancellationToken: ct));

        if (header is null)
            return null;

        return await GraphSnapshotRelationalRead.HydrateAsync(
            connection,
            transaction,
            header,
            jsonRowForMerge: null,
            ct);
    }

    /// <summary>
    ///     Inserts relational graph slices that are still empty while JSON columns contain data (idempotent per slice).
    /// </summary>
    internal static async Task BackfillRelationalSlicesAsync(
        GraphSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(connection);

        Guid graphSnapshotId = snapshot.GraphSnapshotId;

        int nodesCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.GraphSnapshotNodes WHERE GraphSnapshotId = @GraphSnapshotId",
            new { GraphSnapshotId = graphSnapshotId },
            ct);

        int warningsCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.GraphSnapshotWarnings WHERE GraphSnapshotId = @GraphSnapshotId",
            new { GraphSnapshotId = graphSnapshotId },
            ct);

        int edgesCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.GraphSnapshotEdges WHERE GraphSnapshotId = @GraphSnapshotId",
            new { GraphSnapshotId = graphSnapshotId },
            ct);

        int edgePropsCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.GraphSnapshotEdgeProperties WHERE GraphSnapshotId = @GraphSnapshotId",
            new { GraphSnapshotId = graphSnapshotId },
            ct);

        bool needsRelationalSlices = (nodesCount == 0 && snapshot.Nodes.Count > 0)
            || (warningsCount == 0 && snapshot.Warnings.Count > 0)
            || (edgesCount == 0 && snapshot.Edges.Count > 0)
            || (edgesCount > 0 && edgePropsCount == 0 && snapshot.Edges.Count > 0);

        if (!needsRelationalSlices)
            return;

        const string scopeSql = """
                                SELECT
                                    COALESCE(gs.TenantId, cs.TenantId) AS TenantId,
                                    COALESCE(gs.WorkspaceId, cs.WorkspaceId) AS WorkspaceId,
                                    COALESCE(gs.ScopeProjectId, cs.ScopeProjectId) AS ScopeProjectId
                                FROM dbo.GraphSnapshots AS gs
                                LEFT JOIN dbo.ContextSnapshots AS cs ON gs.ContextSnapshotId = cs.SnapshotId
                                WHERE gs.GraphSnapshotId = @GraphSnapshotId;
                                """;

        GraphSnapshotDenormScopeRow? scopeHdr =
            await connection.QuerySingleOrDefaultAsync<GraphSnapshotDenormScopeRow>(
                new CommandDefinition(scopeSql, new { GraphSnapshotId = graphSnapshotId }, transaction,
                    cancellationToken: ct));

        if (scopeHdr?.TenantId is null || scopeHdr.WorkspaceId is null || scopeHdr.ScopeProjectId is null)
            throw new InvalidOperationException(
                $"dbo.GraphSnapshots row {graphSnapshotId} (and ContextSnapshots join fallback) lacks denormalized RLS scope "
                + "(tenant/workspace/scope-project); cannot backfill graph relational tables.");

        ScopeContext scopeFill = new()
        {
            TenantId = scopeHdr.TenantId!.Value,
            WorkspaceId = scopeHdr.WorkspaceId!.Value,
            ProjectId = scopeHdr.ScopeProjectId!.Value
        };

        if (nodesCount == 0 && snapshot.Nodes.Count > 0)
            await InsertNodesAndPropertiesAsync(snapshot, connection, transaction, scopeFill, ct);

        if (warningsCount == 0 && snapshot.Warnings.Count > 0)
            await InsertWarningsAsync(snapshot, connection, transaction, scopeFill, ct);

        if (edgesCount == 0 && snapshot.Edges.Count > 0)
        {
            await InsertIndexedEdgesAsync(connection, transaction, snapshot, scopeFill, ct);
            await InsertEdgePropertiesAsync(snapshot, connection, transaction, scopeFill, ct);
        }
        else if (edgesCount > 0 && edgePropsCount == 0 && snapshot.Edges.Count > 0)
            await InsertEdgePropertiesAsync(snapshot, connection, transaction, scopeFill, ct);
    }

    /// <summary>Nullable row for COALESCE-loaded graph snapshot RLS scope during JSON→relational backfill.</summary>
    private sealed record GraphSnapshotDenormScopeRow(Guid? TenantId, Guid? WorkspaceId, Guid? ScopeProjectId);

    private sealed class IndexedEdgeRow
    {
        public string EdgeId
        {
            get;
            init;
        } = null!;

        public string FromNodeId
        {
            get;
            init;
        } = null!;

        public string ToNodeId
        {
            get;
            init;
        } = null!;

        public string EdgeType
        {
            get;
            init;
        } = null!;

        public double Weight
        {
            get;
            init;
        }
    }
}
