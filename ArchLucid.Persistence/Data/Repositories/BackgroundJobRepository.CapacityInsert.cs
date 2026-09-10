using System.Data;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class BackgroundJobRepository
{
    /// <inheritdoc />
    public async Task<bool> TryInsertPendingJobIfUnderCapacityAsync(
        BackgroundJobRow row,
        int maxPendingJobs,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(row);

        if (maxPendingJobs <= 0)
            return false;

        const string countSql = """
                                SELECT COUNT_BIG(1)
                                FROM dbo.BackgroundJobs WITH (UPDLOCK, HOLDLOCK)
                                WHERE State IN (N'Pending', N'Running')
                                """;

        const string insertSql = """
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
        using IDbTransaction transaction = connection.BeginTransaction(IsolationLevel.ReadCommitted);

        try
        {
            long pendingCount = await connection.ExecuteScalarAsync<long>(
                new CommandDefinition(countSql, transaction: transaction, cancellationToken: cancellationToken));

            if (pendingCount >= maxPendingJobs)
            {
                transaction.Commit();

                return false;
            }

            await connection.ExecuteAsync(
                new CommandDefinition(insertSql, row, transaction, cancellationToken: cancellationToken));

            transaction.Commit();

            return true;
        }
        catch
        {
            transaction.Rollback();

            throw;
        }
    }
}
