using System.Data;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class BackgroundJobRepository
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<string>> ResetStaleRunningJobsOlderThanAsync(
        TimeSpan maxRunningAge,
        CancellationToken cancellationToken = default)
    {
        if (maxRunningAge <= TimeSpan.Zero)
            return Array.Empty<string>();

        const string sql = """
                           UPDATE dbo.BackgroundJobs
                           SET State = CASE
                                           WHEN RetryCount < MaxRetries
                                                OR (MaxRetries = 0 AND RetryCount = 0) THEN N'Pending'
                                           ELSE N'Failed'
                                       END,
                               StartedUtc = CASE
                                                WHEN RetryCount < MaxRetries
                                                     OR (MaxRetries = 0 AND RetryCount = 0) THEN NULL
                                                ELSE StartedUtc
                                            END,
                               CompletedUtc = CASE
                                                  WHEN RetryCount < MaxRetries
                                                       OR (MaxRetries = 0 AND RetryCount = 0) THEN NULL
                                                  ELSE SYSUTCDATETIME()
                                              END,
                               RetryCount = CASE
                                                WHEN RetryCount < MaxRetries
                                                     OR (MaxRetries = 0 AND RetryCount = 0) THEN RetryCount + 1
                                                ELSE RetryCount
                                            END,
                               Error = CASE
                                           WHEN RetryCount < MaxRetries
                                                OR (MaxRetries = 0 AND RetryCount = 0) THEN COALESCE(Error, N'')
                                           ELSE COALESCE(
                                               NULLIF(Error, N''),
                                               N'Worker lost before completion; retries exhausted.')
                                       END
                           OUTPUT inserted.JobId AS JobId, inserted.State AS State
                           WHERE State = N'Running'
                             AND StartedUtc IS NOT NULL
                             AND StartedUtc < @StaleBeforeUtc;
                           """;

        DateTime staleBeforeUtc = TimeProvider.System.UtcNowDateTime().Subtract(maxRunningAge);

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<StaleRunningJobReclaimRow> rows = await connection.QueryAsync<StaleRunningJobReclaimRow>(
            new CommandDefinition(
                sql,
                new { StaleBeforeUtc = staleBeforeUtc },
                cancellationToken: cancellationToken));

        return rows
            .Where(static row => string.Equals(row.State, "Pending", StringComparison.OrdinalIgnoreCase))
            .Select(static row => row.JobId)
            .ToArray();
    }

    private sealed class StaleRunningJobReclaimRow
    {
        public string JobId { get; init; } = string.Empty;

        public string State { get; init; } = string.Empty;
    }
}
