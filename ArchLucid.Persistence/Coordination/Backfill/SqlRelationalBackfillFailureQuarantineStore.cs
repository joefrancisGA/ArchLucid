using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Coordination.Backfill;

/// <summary>Tracks repeated backfill failures and skip-after-max-retries quarantine (TB-086).</summary>
[ExcludeFromCodeCoverage(Justification =
    "SQL-dependent quarantine persistence; covered by SqlRelationalBackfillServiceSqlIntegrationTests.")]
public sealed class SqlRelationalBackfillFailureQuarantineStore(ISqlConnectionFactory connectionFactory)
{
    public async Task<bool> ShouldSkipAsync(
        string stage,
        string entityKey,
        int maxRetries,
        bool forceRetry,
        CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(stage);
        ArgumentException.ThrowIfNullOrWhiteSpace(entityKey);

        if (forceRetry || maxRetries <= 0)
            return false;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        int? failureCount = await connection.ExecuteScalarAsync<int?>(
            new CommandDefinition(
                """
                SELECT FailureCount
                FROM dbo.BackfillFailures
                WHERE Stage = @Stage AND EntityKey = @EntityKey;
                """,
                new { Stage = stage, EntityKey = entityKey },
                cancellationToken: ct));

        return failureCount.HasValue && failureCount.Value >= maxRetries;
    }

    public async Task RecordFailureAsync(
        string stage,
        string entityKey,
        string message,
        int maxRetries,
        CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(stage);
        ArgumentException.ThrowIfNullOrWhiteSpace(entityKey);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                MERGE dbo.BackfillFailures AS target
                USING (SELECT @Stage AS Stage, @EntityKey AS EntityKey) AS source
                ON target.Stage = source.Stage AND target.EntityKey = source.EntityKey
                WHEN MATCHED THEN
                    UPDATE SET
                        FailureCount = target.FailureCount + 1,
                        LastError = @LastError,
                        LastAttemptUtc = SYSUTCDATETIME(),
                        SkippedAfterMaxRetries = CASE
                            WHEN target.FailureCount + 1 >= @MaxRetries THEN 1
                            ELSE target.SkippedAfterMaxRetries
                        END
                WHEN NOT MATCHED THEN
                    INSERT (Stage, EntityKey, FailureCount, LastError, LastAttemptUtc, SkippedAfterMaxRetries)
                    VALUES (
                        @Stage,
                        @EntityKey,
                        1,
                        @LastError,
                        SYSUTCDATETIME(),
                        CASE WHEN 1 >= @MaxRetries THEN 1 ELSE 0 END);
                """,
                new
                {
                    Stage = stage,
                    EntityKey = entityKey,
                    LastError = message,
                    MaxRetries = maxRetries,
                },
                cancellationToken: ct));
    }

    public async Task ClearAsync(string stage, string entityKey, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(stage);
        ArgumentException.ThrowIfNullOrWhiteSpace(entityKey);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                DELETE FROM dbo.BackfillFailures
                WHERE Stage = @Stage AND EntityKey = @EntityKey;
                """,
                new { Stage = stage, EntityKey = entityKey },
                cancellationToken: ct));
    }
}
