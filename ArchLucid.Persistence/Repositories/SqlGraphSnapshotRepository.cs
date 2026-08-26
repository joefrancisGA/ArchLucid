using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.GraphSnapshots;
using ArchLucid.Persistence.RelationalRead;

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
public sealed partial class SqlGraphSnapshotRepository(
    ISqlConnectionFactory connectionFactory,
    IScopeContextProvider scopeContextProvider) : IGraphSnapshotRepository, IGraphSnapshotSqlAuthorityWriter
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task<GraphSnapshot?> GetByIdAsync(ScopeContext scope, Guid graphSnapshotId, CancellationToken ct)
    {
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        return await GetByIdAsync(scope, graphSnapshotId, connection, null, ct);
    }

    public async Task<GraphSnapshot?> GetLatestByContextSnapshotIdAsync(
        ScopeContext scope,
        Guid contextSnapshotId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        string sql = """
                     SELECT TOP 1
                         GraphSnapshotId, ContextSnapshotId, RunId, CreatedUtc
                     FROM dbo.GraphSnapshots
                     WHERE ContextSnapshotId = @ContextSnapshotId
                     """ + PersistenceTenantScope.AndScopeProjectIdTripleWhere(scope) + " ORDER BY CreatedUtc DESC;";

        DynamicParameters parameters = new();
        parameters.Add("ContextSnapshotId", contextSnapshotId);
        PersistenceTenantScope.AddScopeTripleIfNeeded(parameters, scope);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        GraphSnapshotRelationalRead.GraphSnapshotHeaderRow? header =
            await connection.QuerySingleOrDefaultAsync<GraphSnapshotRelationalRead.GraphSnapshotHeaderRow>(
                new CommandDefinition(
                    sql,
                    parameters,
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

    public async Task<GraphSnapshot?> GetByIdAsync(
        ScopeContext scope,
        Guid graphSnapshotId,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        string sql = """
                     SELECT
                         GraphSnapshotId, ContextSnapshotId, RunId, CreatedUtc
                     FROM dbo.GraphSnapshots
                     WHERE GraphSnapshotId = @GraphSnapshotId
                     """ + PersistenceTenantScope.AndScopeProjectIdTripleWhere(scope) + ";";

        DynamicParameters parameters = new();
        parameters.Add("GraphSnapshotId", graphSnapshotId);
        PersistenceTenantScope.AddScopeTripleIfNeeded(parameters, scope);

        GraphSnapshotRelationalRead.GraphSnapshotHeaderRow? header =
            await connection.QuerySingleOrDefaultAsync<GraphSnapshotRelationalRead.GraphSnapshotHeaderRow>(
                new CommandDefinition(
                    sql,
                    parameters,
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
