using System.Data;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class BackgroundJobRepository
{
    public async Task InsertAsync(BackgroundJobRow row, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(row);

        const string sql = """
                           INSERT INTO dbo.BackgroundJobs
                           (
                               JobId,
                               WorkUnitJson,
                               State,
                               CreatedUtc,
                               StartedUtc,
                               CompletedUtc,
                               Error,
                               FileName,
                               ContentType,
                               RetryCount,
                               MaxRetries,
                               ResultBlobName
                           )
                           VALUES
                           (
                               @JobId,
                               @WorkUnitJson,
                               @State,
                               @CreatedUtc,
                               @StartedUtc,
                               @CompletedUtc,
                               @Error,
                               @FileName,
                               @ContentType,
                               @RetryCount,
                               @MaxRetries,
                               @ResultBlobName
                           )
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(sql, row, cancellationToken: cancellationToken));
    }

    public async Task<BackgroundJobRow?> GetAsync(string jobId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(jobId))
            return null;

        const string sql = """
                           SELECT
                               JobId,
                               WorkUnitJson,
                               State,
                               CreatedUtc,
                               StartedUtc,
                               CompletedUtc,
                               Error,
                               FileName,
                               ContentType,
                               RetryCount,
                               MaxRetries,
                               ResultBlobName
                           FROM dbo.BackgroundJobs
                           WHERE JobId = @JobId
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<BackgroundJobRow>(
            new CommandDefinition(sql, new { JobId = jobId }, cancellationToken: cancellationToken));
    }
}
