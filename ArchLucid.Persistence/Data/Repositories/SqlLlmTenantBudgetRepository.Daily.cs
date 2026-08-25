using System.Data;
using System.Globalization;

using ArchLucid.Core.Budgeting;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class SqlLlmTenantBudgetRepository
{
    private async Task<LlmTenantBudgetStateReadModel> GetOrCreateDailyAsync(
        Guid tenantId,
        string periodKey,
        CancellationToken cancellationToken)
    {
        DateOnly utcDay = DateOnly.ParseExact(periodKey, "yyyy-MM-dd", CultureInfo.InvariantCulture);

        using IDbConnection connection = await _connectionFactory
            .CreateOpenConnectionAsync(cancellationToken)
            .ConfigureAwait(false);

        LlmTenantBudgetStateReadModel? row = await SelectDailyAsync(connection, tenantId, utcDay, cancellationToken)
            .ConfigureAwait(false);

        if (row is not null)
            return row;

        DateTime utcDayDate = utcDay.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        try
        {
            await connection
                .ExecuteAsync(
                    new CommandDefinition(
                        LlmTenantBudgetSql.InsertDaily,
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

        row = await SelectDailyAsync(connection, tenantId, utcDay, cancellationToken).ConfigureAwait(false);

        return row ?? throw new InvalidOperationException("Failed to read LLM daily token window row after insert.");
    }

    private async Task<LlmTenantBudgetReserveResult> ReserveDailyAsync(
        LlmTenantBudgetReserveRequest request,
        CancellationToken cancellationToken)
    {
        if (request.ReserveTokens < 1)
        {
            using IDbConnection c = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);
            DateOnly day = DateOnly.ParseExact(request.PeriodKey, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            LlmTenantBudgetStateReadModel? cur = await SelectDailyAsync(c, request.TenantId, day, cancellationToken).ConfigureAwait(false);

            return cur is null
                ? new LlmTenantBudgetReserveResult { ConcurrencyConflict = true }
                : new LlmTenantBudgetReserveResult { NewState = cur };
        }

        if (request.HardCapTokens is null)
            throw new ArgumentException("HardCapTokens is required for daily reserve.", nameof(request));

        DateOnly utcDay = DateOnly.ParseExact(request.PeriodKey, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        DateTime utcDayDate = utcDay.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        using IDbConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        int affected = await connection
            .ExecuteAsync(
                new CommandDefinition(
                    LlmTenantBudgetSql.ReserveDaily,
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
            return await ClassifyDailyReserveFailureAsync(
                request.TenantId,
                utcDay,
                request.ExpectedRowVersion,
                request.ReserveTokens,
                request.HardCapTokens.Value,
                cancellationToken).ConfigureAwait(false);

        LlmTenantBudgetStateReadModel model =
            await SelectDailyAsync(connection, request.TenantId, utcDay, cancellationToken).ConfigureAwait(false)
            ?? throw new InvalidOperationException("Daily budget row missing after reserve.");

        return new LlmTenantBudgetReserveResult { NewState = model };

    }

    private async Task<LlmTenantBudgetReserveResult> ClassifyDailyReserveFailureAsync(
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
            await SelectDailyAsync(connection, tenantId, utcDay, cancellationToken).ConfigureAwait(false);

        if (current is null || !current.RowVersion.AsSpan().SequenceEqual(expectedRowVersion))
            return new LlmTenantBudgetReserveResult { ConcurrencyConflict = true };

        return current.TotalTokenPressure + addTokens > hardCap ? new LlmTenantBudgetReserveResult { HardCapBlocked = true, NewState = current } : new LlmTenantBudgetReserveResult { ConcurrencyConflict = true };
    }

    private async Task<LlmTenantBudgetSettleResult> SettleDailyAsync(
        LlmTenantBudgetSettleRequest request,
        CancellationToken cancellationToken)
    {
        DateOnly utcDay = DateOnly.ParseExact(request.PeriodKey, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        DateTime utcDayDate = utcDay.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        if (request is { ActualTokens: 0, ReleaseReservedTokens: 0 })
        {
            using IDbConnection c = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);
            LlmTenantBudgetStateReadModel? cur =
                await SelectDailyAsync(c, request.TenantId, utcDay, cancellationToken).ConfigureAwait(false);

            return cur is null
                ? new LlmTenantBudgetSettleResult { ConcurrencyConflict = true }
                : new LlmTenantBudgetSettleResult { NewState = cur };
        }

        using IDbConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        DailySettleOutput? output = await connection
            .QuerySingleOrDefaultAsync<DailySettleOutput>(
                new CommandDefinition(
                    LlmTenantBudgetSql.SettleDaily,
                    new
                    {
                        request.TenantId,
                        UtcDay = utcDayDate,
                        Actual = request.ActualTokens,
                        Release = request.ReleaseReservedTokens,
                        WarnAt = request.WarnAtTokens,
                        RowVersion = request.ExpectedRowVersion
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        if (output is null)
            return new LlmTenantBudgetSettleResult { ConcurrencyConflict = true };

        LlmTenantBudgetStateReadModel model =
            await SelectDailyAsync(connection, request.TenantId, utcDay, cancellationToken).ConfigureAwait(false)
            ?? throw new InvalidOperationException("Daily budget row missing after settle.");

        bool shouldAudit = !output.OldWarned && output.OldTotal < request.WarnAtTokens
            && output.NewTotal >= request.WarnAtTokens;

        return new LlmTenantBudgetSettleResult
        {
            ConcurrencyConflict = false,
            NewState = model,
            ShouldEmitWarnAudit = shouldAudit
        };
    }

    private static Task<LlmTenantBudgetStateReadModel?> SelectDailyAsync(
        IDbConnection connection,
        Guid tenantId,
        DateOnly utcDay,
        CancellationToken cancellationToken)
    {
        DateTime utcDayDate = utcDay.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        return connection.QuerySingleOrDefaultAsync<LlmTenantBudgetStateReadModel>(
            new CommandDefinition(LlmTenantBudgetSql.SelectDaily, new
            {
                TenantId = tenantId,
                UtcDay = utcDayDate
            }, cancellationToken: cancellationToken));
    }

    private sealed class DailySettleOutput
    {
        public long NewTotal
        {
            get; init;
        }

        public bool NewWarned
        {
            get; init;
        }

        public long OldTotal
        {
            get; init;
        }

        public bool OldWarned
        {
            get; init;
        }
    }
}
