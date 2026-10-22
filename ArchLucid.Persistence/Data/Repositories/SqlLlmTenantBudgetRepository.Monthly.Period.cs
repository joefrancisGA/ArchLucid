using System.Data;

using ArchLucid.Core.Budgeting;
using ArchLucid.Persistence.Budgeting;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class SqlLlmTenantBudgetRepository
{
    /// <inheritdoc />
    public async Task<string> GetSqlUtcMonthlyPeriodKeyAsync(CancellationToken cancellationToken = default)
    {
        using IDbConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        (int utcYear, int utcMonth) = await ReadSqlUtcYearMonthAsync(connection, cancellationToken).ConfigureAwait(false);

        return LlmTenantBudgetPeriodCore.FormatUtcYearMonth(utcYear, utcMonth);
    }

    private async Task<LlmTenantBudgetStateReadModel> GetOrCreateMonthlyAsync(
        Guid tenantId,
        string periodKey,
        CancellationToken cancellationToken)
    {
        (int utcYear, int utcMonth) = LlmTenantBudgetPeriodCore.ParseUtcYearMonth(periodKey);
        LlmTenantBudgetPeriodCore.ValidateUtcYearMonth(utcYear, utcMonth);

        using IDbConnection connection = await _connectionFactory
            .CreateOpenConnectionAsync(cancellationToken)
            .ConfigureAwait(false);

        LlmTenantBudgetStateReadModel? row =
            await SelectMonthlyAsync(connection, tenantId, utcYear, utcMonth, cancellationToken).ConfigureAwait(false);

        if (row is not null)
            return row;

        try
        {
            await connection
                .ExecuteAsync(
                    new CommandDefinition(
                        LlmTenantBudgetSql.InsertMonthly,
                        new
                        {
                            TenantId = tenantId,
                            UtcYear = utcYear,
                            UtcMonth = utcMonth
                        },
                        cancellationToken: cancellationToken))
                .ConfigureAwait(false);
        }
        catch (SqlException ex) when (ex.Number is 2601 or 2627)
        {
        }

        row = await SelectMonthlyAsync(connection, tenantId, utcYear, utcMonth, cancellationToken).ConfigureAwait(false);

        return row ?? throw new InvalidOperationException("Failed to read LLM monthly budget row after insert.");
    }

    private static Task<LlmTenantBudgetStateReadModel?> SelectMonthlyAsync(
        IDbConnection connection,
        Guid tenantId,
        int utcYear,
        int utcMonth,
        CancellationToken cancellationToken)
    {
        return connection.QuerySingleOrDefaultAsync<LlmTenantBudgetStateReadModel>(
            new CommandDefinition(
                LlmTenantBudgetSql.SelectMonthly,
                new
                {
                    TenantId = tenantId,
                    UtcYear = utcYear,
                    UtcMonth = utcMonth
                },
                cancellationToken: cancellationToken));
    }

    private static async Task<(int Year, int Month)> ReadSqlUtcYearMonthAsync(
        IDbConnection connection,
        CancellationToken cancellationToken)
    {
        (int Year, int Month) row = await connection
            .QuerySingleAsync<(int Year, int Month)>(
                new CommandDefinition(LlmTenantBudgetSql.SelectSqlUtcYearMonth, cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        LlmTenantBudgetPeriodCore.ValidateUtcYearMonth(row.Year, row.Month);

        return row;
    }

    private static async Task EnsureMonthlyRowAsync(
        IDbConnection connection,
        Guid tenantId,
        int utcYear,
        int utcMonth,
        CancellationToken cancellationToken)
    {
        LlmTenantBudgetStateReadModel? row =
            await SelectMonthlyAsync(connection, tenantId, utcYear, utcMonth, cancellationToken).ConfigureAwait(false);

        if (row is not null)
            return;

        try
        {
            await connection
                .ExecuteAsync(
                    new CommandDefinition(
                        LlmTenantBudgetSql.InsertMonthly,
                        new
                        {
                            TenantId = tenantId,
                            UtcYear = utcYear,
                            UtcMonth = utcMonth
                        },
                        cancellationToken: cancellationToken))
                .ConfigureAwait(false);
        }
        catch (SqlException ex) when (ex.Number is 2601 or 2627)
        {
        }
    }
}
