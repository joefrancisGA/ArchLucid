using System.Data;

using Dapper;

namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Executes write batches as a small number of multi-row SQL commands (avoids per-row round trips).
/// </summary>
internal static class SqlChunkedDapperBatch
{
    /// <summary>Conservative row cap per command to stay under SQL Server parameter limits.</summary>
    internal const int DefaultMaxRowsPerCommand = 100;

    internal static async Task ExecuteChunksAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        int totalCount,
        int maxRowsPerCommand,
        Func<int, int, SqlChunkedBatchCommand> buildChunk,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(buildChunk);

        if (totalCount <= 0)
            return;

        if (maxRowsPerCommand <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxRowsPerCommand));

        for (int offset = 0; offset < totalCount; offset += maxRowsPerCommand)
        {
            int rowCount = Math.Min(maxRowsPerCommand, totalCount - offset);
            SqlChunkedBatchCommand command = buildChunk(offset, rowCount);

            await connection.ExecuteAsync(
                new CommandDefinition(
                    command.CommandText,
                    command.Parameters,
                    transaction,
                    cancellationToken: cancellationToken)).ConfigureAwait(false);
        }
    }
}
