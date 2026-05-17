using System.Data;
using System.Globalization;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Orchestration;
/// <summary>
///     Durable lease rows enforcing per-tenant authority pipeline concurrency (<c>dbo.AuthorityPipelineTenantExecutionLease</c>).
/// </summary>
public sealed class SqlAuthorityPipelineTenantExecutionLeaseRepository(ISqlConnectionFactory sqlConnectionFactory)
{
    private readonly ISqlConnectionFactory _sqlConnectionFactory =
        sqlConnectionFactory ?? throw new ArgumentNullException(nameof(sqlConnectionFactory));

    internal async Task<bool> TryAcquireLeaseAsync(
        Guid tenantId,
        Guid runId,
        int maxConcurrent,
        DateTime staleBeforeUtc,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _sqlConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await using SqlTransaction transaction =
            (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

        const string deleteStaleSql = """
                                    DELETE FROM dbo.AuthorityPipelineTenantExecutionLease
                                    WHERE TenantId = @TenantId
                                      AND AcquiredUtc < @StaleBeforeUtc;
                                    """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                deleteStaleSql,
                new { TenantId = tenantId, StaleBeforeUtc = staleBeforeUtc },
                transaction,
                cancellationToken: cancellationToken));

        const string countSql = """
                                 SELECT COUNT_BIG(*)
                                 FROM dbo.AuthorityPipelineTenantExecutionLease
                                 WHERE TenantId = @TenantId;
                                 """;

        object? activeScalar = await connection.ExecuteScalarAsync(
            new CommandDefinition(countSql, new { TenantId = tenantId }, transaction,
                cancellationToken: cancellationToken));
        long active = activeScalar is long l ? l : Convert.ToInt64(activeScalar, CultureInfo.InvariantCulture);

        if (active >= maxConcurrent)

        {

            await transaction.RollbackAsync(cancellationToken);

            return false;
        }

        const string insertSql = """
                                 INSERT INTO dbo.AuthorityPipelineTenantExecutionLease (RunId, TenantId, AcquiredUtc)
                                 VALUES (@RunId, @TenantId, SYSUTCDATETIME());
                                 """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertSql,
                new { RunId = runId, TenantId = tenantId },
                transaction,
                cancellationToken: cancellationToken));

        await transaction.CommitAsync(cancellationToken);

        return true;
    }

    internal async Task ReleaseLeaseAsync(Guid runId, CancellationToken cancellationToken)
    {
        const string sql = """
                           DELETE FROM dbo.AuthorityPipelineTenantExecutionLease
                           WHERE RunId = @RunId;
                           """;

        await using SqlConnection connection = await _sqlConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(new CommandDefinition(sql, new { RunId = runId },
            cancellationToken: cancellationToken));
    }
}
