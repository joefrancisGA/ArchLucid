using System.Data;

using ArchiForge.Decisioning.Interfaces;
using ArchiForge.Decisioning.Models;
using ArchiForge.Persistence.Connections;
using ArchiForge.Persistence.Serialization;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchiForge.Persistence.Repositories;

/// <summary>
/// SQL Server-backed implementation of <see cref="IFindingsSnapshotRepository"/>.
/// Persists <see cref="FindingsSnapshot"/> to the <c>dbo.FindingsSnapshots</c> table as a single
/// <c>FindingsJson</c> column and retrieves by deserialization.
/// </summary>
public sealed class SqlFindingsSnapshotRepository(ISqlConnectionFactory connectionFactory) : IFindingsSnapshotRepository
{
    public async Task SaveAsync(
        FindingsSnapshot snapshot,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        const string sql = """
            INSERT INTO dbo.FindingsSnapshots
            (
                FindingsSnapshotId, RunId, ContextSnapshotId, GraphSnapshotId, CreatedUtc, FindingsJson
            )
            VALUES
            (
                @FindingsSnapshotId, @RunId, @ContextSnapshotId, @GraphSnapshotId, @CreatedUtc, @FindingsJson
            );
            """;

        object args = new
        {
            snapshot.FindingsSnapshotId,
            snapshot.RunId,
            snapshot.ContextSnapshotId,
            snapshot.GraphSnapshotId,
            snapshot.CreatedUtc,
            FindingsJson = JsonEntitySerializer.Serialize(snapshot)
        };

        if (connection is not null)
        {
            await connection.ExecuteAsync(new CommandDefinition(sql, args, transaction, cancellationToken: ct)).ConfigureAwait(false);
            return;
        }

        await using SqlConnection owned = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await owned.ExecuteAsync(new CommandDefinition(sql, args, cancellationToken: ct)).ConfigureAwait(false);
    }

    public async Task<FindingsSnapshot?> GetByIdAsync(Guid findingsSnapshotId, CancellationToken ct)
    {
        const string sql = """
            SELECT FindingsJson
            FROM dbo.FindingsSnapshots
            WHERE FindingsSnapshotId = @FindingsSnapshotId;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        string? json = await connection.QuerySingleOrDefaultAsync<string>(
            new CommandDefinition(sql, new
            {
                FindingsSnapshotId = findingsSnapshotId
            }, cancellationToken: ct)).ConfigureAwait(false);

        return json is null ? null : JsonEntitySerializer.Deserialize<FindingsSnapshot>(json);
    }
}
