using System.Data;

using ArchiForge.KnowledgeGraph.Interfaces;
using ArchiForge.KnowledgeGraph.Models;
using ArchiForge.Persistence.Connections;
using ArchiForge.Persistence.Serialization;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchiForge.Persistence.Repositories;

/// <summary>
/// SQL Server-backed implementation of <see cref="IGraphSnapshotRepository"/>.
/// Persists and retrieves <see cref="GraphSnapshot"/> rows from the <c>dbo.GraphSnapshots</c> table,
/// serializing node, edge, and warning collections to JSON columns.
/// </summary>
public sealed class SqlGraphSnapshotRepository(ISqlConnectionFactory connectionFactory) : IGraphSnapshotRepository
{
    public async Task SaveAsync(
        GraphSnapshot snapshot,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        const string sql = """
            INSERT INTO dbo.GraphSnapshots
            (
                GraphSnapshotId, ContextSnapshotId, RunId, CreatedUtc,
                NodesJson, EdgesJson, WarningsJson
            )
            VALUES
            (
                @GraphSnapshotId, @ContextSnapshotId, @RunId, @CreatedUtc,
                @NodesJson, @EdgesJson, @WarningsJson
            );
            """;

        object args = new
        {
            snapshot.GraphSnapshotId,
            snapshot.ContextSnapshotId,
            snapshot.RunId,
            snapshot.CreatedUtc,
            NodesJson = JsonEntitySerializer.Serialize(snapshot.Nodes),
            EdgesJson = JsonEntitySerializer.Serialize(snapshot.Edges),
            WarningsJson = JsonEntitySerializer.Serialize(snapshot.Warnings)
        };

        if (connection is not null)
        {
            await connection.ExecuteAsync(new CommandDefinition(sql, args, transaction, cancellationToken: ct)).ConfigureAwait(false);
            return;
        }

        await using SqlConnection owned = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await owned.ExecuteAsync(new CommandDefinition(sql, args, cancellationToken: ct)).ConfigureAwait(false);
    }

    public async Task<GraphSnapshot?> GetByIdAsync(Guid graphSnapshotId, CancellationToken ct)
    {
        const string sql = """
            SELECT
                GraphSnapshotId, ContextSnapshotId, RunId, CreatedUtc,
                NodesJson, EdgesJson, WarningsJson
            FROM dbo.GraphSnapshots
            WHERE GraphSnapshotId = @GraphSnapshotId;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        GraphSnapshotRow? row = await connection.QuerySingleOrDefaultAsync<GraphSnapshotRow>(
            new CommandDefinition(sql, new
            {
                GraphSnapshotId = graphSnapshotId
            }, cancellationToken: ct)).ConfigureAwait(false);

        if (row is null)
            return null;

        try
        {
            return new GraphSnapshot
            {
                GraphSnapshotId = row.GraphSnapshotId,
                ContextSnapshotId = row.ContextSnapshotId,
                RunId = row.RunId,
                CreatedUtc = row.CreatedUtc,
                Nodes = JsonEntitySerializer.Deserialize<List<GraphNode>>(row.NodesJson),
                Edges = JsonEntitySerializer.Deserialize<List<GraphEdge>>(row.EdgesJson),
                Warnings = JsonEntitySerializer.Deserialize<List<string>>(row.WarningsJson)
            };
        }
        catch (InvalidOperationException ex)
        {
            throw new InvalidOperationException(
                $"Failed to deserialize GraphSnapshot '{row.GraphSnapshotId}'. " +
                "The stored JSON may be corrupt or from an incompatible schema version.", ex);
        }
    }

    private sealed class GraphSnapshotRow
    {
        public Guid GraphSnapshotId
        {
            get; init;
        }
        public Guid ContextSnapshotId
        {
            get; init;
        }
        public Guid RunId
        {
            get; init;
        }
        public DateTime CreatedUtc
        {
            get; init;
        }
        public string NodesJson { get; init; } = null!;
        public string EdgesJson { get; init; } = null!;
        public string WarningsJson { get; init; } = null!;
    }
}
