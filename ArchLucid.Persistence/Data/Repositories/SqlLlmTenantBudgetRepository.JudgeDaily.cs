using System.Data;
using System.Globalization;

using ArchLucid.Core.Budgeting;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class SqlLlmTenantBudgetRepository
{
    private async Task<LlmTenantBudgetStateReadModel> GetOrCreateJudgeDailyAsync(
        Guid tenantId,
        string periodKey,
        CancellationToken cancellationToken)
    {
        DateOnly utcDay = DateOnly.ParseExact(periodKey, "yyyy-MM-dd", CultureInfo.InvariantCulture);

        using IDbConnection connection = await _connectionFactory
            .CreateOpenConnectionAsync(cancellationToken)
            .ConfigureAwait(false);

        LlmTenantBudgetStateReadModel? row = await SelectJudgeDailyAsync(connection, tenantId, utcDay, cancellationToken)
            .ConfigureAwait(false);

        if (row is not null)
            return row;

        DateTime utcDayDate = utcDay.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        try
        {
            await connection
                .ExecuteAsync(
                    new CommandDefinition(
                        LlmTenantBudgetSql.InsertJudgeDaily,
                        new
                        {
                            TenantId = tenantId,
                            UtcDay = utcDayDate
                        },
                        cancellationToken: cancellationToken))
                .ConfigureAwait(false);
        }
        catch (SqlException ex) when (ex.Number is 2601 or 2627)
        {
        }

        row = await SelectJudgeDailyAsync(connection, tenantId, utcDay, cancellationToken).ConfigureAwait(false);

        return row ?? throw new InvalidOperationException("Failed to read LLM judge daily token window row after insert.");
    }

    private async Task<LlmTenantBudgetReserveResult> ReserveJudgeDailyAsync(
        LlmTenantBudgetReserveRequest request,
        CancellationToken cancellationToken)
    {
        if (request.ReserveTokens < 1)
        {
            using IDbConnection c = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);
            DateOnly day = DateOnly.ParseExact(request.PeriodKey, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            LlmTenantBudgetStateReadModel? cur = await SelectJudgeDailyAsync(c, request.TenantId, day, cancellationToken).ConfigureAwait(false);

            return cur is null
                ? new LlmTenantBudgetReserveResult { ConcurrencyConflict = true }
                : new LlmTenantBudgetReserveResult { NewState = cur };
        }

        if (request.HardCapTokens is null)
            throw new ArgumentException("HardCapTokens is required for judge daily reserve.", nameof(request));

        DateOnly utcDay = DateOnly.ParseExact(request.PeriodKey, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        DateTime utcDayDate = utcDay.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        using IDbConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        int affected = await connection
            .ExecuteAsync(
                new CommandDefinition(
                    LlmTenantBudgetSql.ReserveJudgeDaily,
                    new
                    {
                        request.TenantId,
                        UtcDay = utcDayDate,
                        Add = request.ReserveTokens,
                        RowVersion = request.ExpectedRowVersion,
                        HardCap = request.HardCapTokens.Value
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        if (affected != 1)
            return await ClassifyJudgeDailyReserveFailureAsync(
                request.TenantId,
                utcDay,
                request.ExpectedRowVersion,
                request.ReserveTokens,
                request.HardCapTokens.Value,
                cancellationToken).ConfigureAwait(false);

        LlmTenantBudgetStateReadModel model =
            await SelectJudgeDailyAsync(connection, request.TenantId, utcDay, cancellationToken).ConfigureAwait(false)
            ?? throw new InvalidOperationException("Judge daily budget row missing after reserve.");

        return new LlmTenantBudgetReserveResult { NewState = model };
    }

    private async Task<LlmTenantBudgetReserveResult> ClassifyJudgeDailyReserveFailureAsync(
        Guid tenantId,
        DateOnly utcDay,
        byte[] expectedRowVersion,
        long addTokens,
        long hardCap,
        CancellationToken cancellationToken)
    {
        using IDbConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);
        LlmTenantBudgetStateReadModel? current =
            await SelectJudgeDailyAsync(connection, tenantId, utcDay, cancellationToken).ConfigureAwait(false);

        if (current is null || !current.RowVersion.AsSpan().SequenceEqual(expectedRowVersion))
            return new LlmTenantBudgetReserveResult { ConcurrencyConflict = true };

        return current.TotalTokenPressure + addTokens > hardCap
            ? new LlmTenantBudgetReserveResult { HardCapBlocked = true, NewState = current }
            : new LlmTenantBudgetReserveResult { ConcurrencyConflict = true };
    }

    private async Task<LlmTenantBudgetSettleResult> SettleJudgeDailyAsync(
        LlmTenantBudgetSettleRequest request,
        CancellationToken cancellationToken)
    {
        DateOnly utcDay = DateOnly.ParseExact(request.PeriodKey, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        DateTime utcDayDate = utcDay.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        if (request is { ActualTokens: 0, ReleaseReservedTokens: 0 })
        {
            using IDbConnection c = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);
            LlmTenantBudgetStateReadModel? cur =
                await SelectJudgeDailyAsync(c, request.TenantId, utcDay, cancellationToken).ConfigureAwait(false);

            return cur is null
                ? new LlmTenantBudgetSettleResult { ConcurrencyConflict = true }
                : new LlmTenantBudgetSettleResult { NewState = cur };
        }

        using IDbConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        int affected = await connection
            .ExecuteAsync(
                new CommandDefinition(
                    LlmTenantBudgetSql.SettleJudgeDaily,
                    new
                    {
                        request.TenantId,
                        UtcDay = utcDayDate,
                        Actual = request.ActualTokens,
                        Release = request.ReleaseReservedTokens,
                        RowVersion = request.ExpectedRowVersion
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        if (affected != 1)
            return new LlmTenantBudgetSettleResult { ConcurrencyConflict = true };

        LlmTenantBudgetStateReadModel model =
            await SelectJudgeDailyAsync(connection, request.TenantId, utcDay, cancellationToken).ConfigureAwait(false)
            ?? throw new InvalidOperationException("Judge daily budget row missing after settle.");

        return new LlmTenantBudgetSettleResult { NewState = model };
    }

    private static Task<LlmTenantBudgetStateReadModel?> SelectJudgeDailyAsync(
        IDbConnection connection,
        Guid tenantId,
        DateOnly utcDay,
        CancellationToken cancellationToken)
    {
        DateTime utcDayDate = utcDay.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        return connection.QuerySingleOrDefaultAsync<LlmTenantBudgetStateReadModel>(
            new CommandDefinition(LlmTenantBudgetSql.SelectJudgeDaily, new
            {
                TenantId = tenantId,
                UtcDay = utcDayDate
            }, cancellationToken: cancellationToken));
    }
}
