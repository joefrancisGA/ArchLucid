using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Coordination.Backfill;

/// <summary>Persists per-stage backfill keyset cursors (TB-085).</summary>
[ExcludeFromCodeCoverage(Justification =
    "SQL-dependent checkpoint persistence; covered by SqlRelationalBackfillServiceSqlIntegrationTests.")]
public sealed class SqlRelationalBackfillCheckpointStore(ISqlConnectionFactory connectionFactory)
{
    public async Task<SqlRelationalBackfillCursor> GetCursorAsync(string stage, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(stage);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        BackfillCheckpointRow? row = await connection.QuerySingleOrDefaultAsync<BackfillCheckpointRow>(
            new CommandDefinition(
                """
                SELECT LastProcessedCreatedUtc, LastProcessedKey
                FROM dbo.BackfillCheckpoints
                WHERE Stage = @Stage;
                """,
                new { Stage = stage },
                cancellationToken: ct));

        if (row is null)
            return SqlRelationalBackfillCursor.Start;

        if (!Guid.TryParse(row.LastProcessedKey, out Guid entityId))
            return SqlRelationalBackfillCursor.Start;

        return new SqlRelationalBackfillCursor(row.LastProcessedCreatedUtc, entityId);
    }

    public async Task SaveCursorAsync(string stage, SqlRelationalBackfillCursor cursor, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(stage);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                MERGE dbo.BackfillCheckpoints AS target
                USING (SELECT @Stage AS Stage) AS source
                ON target.Stage = source.Stage
                WHEN MATCHED THEN
                    UPDATE SET
                        LastProcessedCreatedUtc = @LastProcessedCreatedUtc,
                        LastProcessedKey = @LastProcessedKey,
                        UpdatedUtc = SYSUTCDATETIME()
                WHEN NOT MATCHED THEN
                    INSERT (Stage, LastProcessedCreatedUtc, LastProcessedKey, UpdatedUtc)
                    VALUES (@Stage, @LastProcessedCreatedUtc, @LastProcessedKey, SYSUTCDATETIME());
                """,
                new
                {
                    Stage = stage,
                    LastProcessedCreatedUtc = cursor.LastProcessedCreatedUtc,
                    LastProcessedKey = cursor.LastProcessedEntityId.ToString("D"),
                },
                cancellationToken: ct));
    }

    private sealed record BackfillCheckpointRow(DateTime LastProcessedCreatedUtc, string LastProcessedKey);
}
