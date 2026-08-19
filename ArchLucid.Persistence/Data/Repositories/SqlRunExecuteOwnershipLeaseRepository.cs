using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Persistence.ApplicationPorts.Interfaces;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; covered by integration and contract tests.")]
public sealed class SqlRunExecuteOwnershipLeaseRepository(IDbConnectionFactory connectionFactory)
    : IRunExecuteOwnershipLeaseRepository
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<bool> TryAcquireOrRenewAsync(
        Guid runId,
        string holderInstanceId,
        int leaseDurationSeconds,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(holderInstanceId);

        if (leaseDurationSeconds < 1)
            throw new ArgumentOutOfRangeException(nameof(leaseDurationSeconds));

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        using IDbTransaction transaction = connection.BeginTransaction(IsolationLevel.ReadCommitted);

        try
        {
            const string selectSql = """
                                     SELECT HolderInstanceId, LeaseExpiresUtc
                                     FROM dbo.RunExecuteOwnershipLeases WITH (UPDLOCK, ROWLOCK)
                                     WHERE RunId = @RunId
                                     """;

            LeaseRow? row = await connection.QuerySingleOrDefaultAsync<LeaseRow>(
                new CommandDefinition(
                    selectSql,
                    new { RunId = runId },
                    transaction,
                    cancellationToken: cancellationToken));

            DateTimeOffset nowUtc = TimeProvider.System.GetUtcNow();
            DateTimeOffset newExpiryUtc = nowUtc.AddSeconds(leaseDurationSeconds);

            if (row is null)
            {
                const string insertSql = """
                                         INSERT INTO dbo.RunExecuteOwnershipLeases
                                             (RunId, HolderInstanceId, LeaseExpiresUtc, HeartbeatUtc)
                                         VALUES
                                             (@RunId, @HolderInstanceId, @LeaseExpiresUtc, @HeartbeatUtc)
                                         """;

                try
                {
                    await connection.ExecuteAsync(
                        new CommandDefinition(
                            insertSql,
                            new
                            {
                                RunId = runId,
                                HolderInstanceId = holderInstanceId,
                                LeaseExpiresUtc = newExpiryUtc,
                                HeartbeatUtc = nowUtc,
                            },
                            transaction,
                            cancellationToken: cancellationToken));

                    transaction.Commit();

                    return true;
                }
                catch (SqlException ex) when (ex.Number == 2627)
                {
                    transaction.Rollback();

                    return false;
                }
            }

            if (row.LeaseExpiresUtc < nowUtc
                || string.Equals(row.HolderInstanceId, holderInstanceId, StringComparison.Ordinal))
            {
                const string updateSql = """
                                         UPDATE dbo.RunExecuteOwnershipLeases
                                         SET HolderInstanceId = @HolderInstanceId,
                                             LeaseExpiresUtc = @LeaseExpiresUtc,
                                             HeartbeatUtc = @HeartbeatUtc
                                         WHERE RunId = @RunId
                                         """;

                await connection.ExecuteAsync(
                    new CommandDefinition(
                        updateSql,
                        new
                        {
                            RunId = runId,
                            HolderInstanceId = holderInstanceId,
                            LeaseExpiresUtc = newExpiryUtc,
                            HeartbeatUtc = nowUtc,
                        },
                        transaction,
                        cancellationToken: cancellationToken));

                transaction.Commit();

                return true;
            }

            transaction.Rollback();

            return false;
        }
        catch
        {
            try
            {
                transaction.Rollback();
            }
            catch (InvalidOperationException)
            {
            }

            throw;
        }
    }

    /// <inheritdoc />
    public async Task TryReleaseAsync(Guid runId, string holderInstanceId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(holderInstanceId))
            return;

        const string sql = """
                           DELETE FROM dbo.RunExecuteOwnershipLeases
                           WHERE RunId = @RunId
                             AND HolderInstanceId = @HolderInstanceId
                           """;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { RunId = runId, HolderInstanceId = holderInstanceId },
                cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task<int> ReleaseAllHeldByInstanceAsync(string holderInstanceId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(holderInstanceId))
            return 0;

        const string sql = """
                           DELETE FROM dbo.RunExecuteOwnershipLeases
                           WHERE HolderInstanceId = @HolderInstanceId
                           """;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { HolderInstanceId = holderInstanceId },
                cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<Guid>> ListExpiredRunIdsAsync(
        DateTimeOffset asOfUtc,
        int maxRows,
        CancellationToken cancellationToken = default)
    {
        int capped = Math.Clamp(maxRows, 1, 500);

        const string sql = """
                           SELECT TOP (@MaxRows) RunId
                           FROM dbo.RunExecuteOwnershipLeases
                           WHERE LeaseExpiresUtc < @AsOfUtc
                           ORDER BY LeaseExpiresUtc ASC
                           """;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<Guid> rows = await connection.QueryAsync<Guid>(
            new CommandDefinition(
                sql,
                new { MaxRows = capped, AsOfUtc = asOfUtc },
                cancellationToken: cancellationToken));

        return rows.ToList();
    }

    /// <inheritdoc />
    public async Task TryDeleteAsync(Guid runId, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           DELETE FROM dbo.RunExecuteOwnershipLeases
                           WHERE RunId = @RunId
                           """;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(sql, new { RunId = runId }, cancellationToken: cancellationToken));
    }

    private sealed record LeaseRow(string HolderInstanceId, DateTimeOffset LeaseExpiresUtc);
}
