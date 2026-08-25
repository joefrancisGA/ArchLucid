using System.Data;
using System.Globalization;

using ArchLucid.Core.Budgeting;
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

        return FormatUtcYearMonth(utcYear, utcMonth);
    }

    private async Task<LlmTenantBudgetStateReadModel> GetOrCreateMonthlyAsync(
        Guid tenantId,
        string periodKey,
        CancellationToken cancellationToken)
    {
        (int utcYear, int utcMonth) = ParseUtcYearMonth(periodKey);
        ValidateUtcYearMonth(utcYear, utcMonth);

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

    private async Task<LlmTenantBudgetReserveResult> ReserveMonthlyAsync(
        LlmTenantBudgetReserveRequest request,
        CancellationToken cancellationToken)
    {
        if (request.ReserveUsd <= 0m)
        {
            using IDbConnection c = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);
            (int y, int m) = ParseUtcYearMonth(request.PeriodKey);
            LlmTenantBudgetStateReadModel? cur = await SelectMonthlyAsync(c, request.TenantId, y, m, cancellationToken).ConfigureAwait(false);

            return cur is null
                ? new LlmTenantBudgetReserveResult { ConcurrencyConflict = true }
                : new LlmTenantBudgetReserveResult { NewState = cur };
        }

        if (request.HardCapUsd is null)
            throw new ArgumentException("HardCapUsd is required for monthly reserve.", nameof(request));

        using IDbConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        (int sqlYear, int sqlMonth) = await ReadSqlUtcYearMonthAsync(connection, cancellationToken).ConfigureAwait(false);
        (int requestYear, int requestMonth) = ParseUtcYearMonth(request.PeriodKey);
        bool periodKeyMismatch = requestYear != sqlYear || requestMonth != sqlMonth;
        string authoritativePeriodKey = FormatUtcYearMonth(sqlYear, sqlMonth);

        await EnsureMonthlyRowAsync(connection, request.TenantId, sqlYear, sqlMonth, cancellationToken).ConfigureAwait(false);

        int affected = await connection
            .ExecuteAsync(
                new CommandDefinition(
                    LlmTenantBudgetSql.ReserveMonthly,
                    new
                    {
                        request.TenantId,
                        UtcYear = sqlYear,
                        UtcMonth = sqlMonth,
                        Add = request.ReserveUsd,
                        RowVersion = request.ExpectedRowVersion,
                        HardCap = request.HardCapUsd.Value
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        if (affected != 1)
        {
            LlmTenantBudgetReserveResult failure = await ClassifyMonthlyReserveFailureAsync(
                request.TenantId,
                sqlYear,
                sqlMonth,
                request.ExpectedRowVersion,
                request.ReserveUsd,
                request.HardCapUsd.Value,
                cancellationToken).ConfigureAwait(false);

            if (periodKeyMismatch)
            {
                return new LlmTenantBudgetReserveResult
                {
                    ConcurrencyConflict = failure.ConcurrencyConflict,
                    HardCapBlocked = failure.HardCapBlocked,
                    NewState = failure.NewState,
                    PeriodKeyMismatch = true,
                    AuthoritativePeriodKey = authoritativePeriodKey
                };
            }

            return failure;
        }

        LlmTenantBudgetStateReadModel model =
            await SelectMonthlyAsync(connection, request.TenantId, sqlYear, sqlMonth, cancellationToken)
                .ConfigureAwait(false)
            ?? throw new InvalidOperationException("Monthly budget row missing after reserve.");

        return new LlmTenantBudgetReserveResult
        {
            NewState = model,
            PeriodKeyMismatch = periodKeyMismatch,
            AuthoritativePeriodKey = periodKeyMismatch ? authoritativePeriodKey : null
        };

    }

    private async Task<LlmTenantBudgetReserveResult> ClassifyMonthlyReserveFailureAsync(
        Guid tenantId,
        int utcYear,
        int utcMonth,
        byte[] expectedRowVersion,
        decimal addUsd,
        decimal hardCap,
        CancellationToken cancellationToken)
    {
        using IDbConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);
        LlmTenantBudgetStateReadModel? current =
            await SelectMonthlyAsync(connection, tenantId, utcYear, utcMonth, cancellationToken).ConfigureAwait(false);

        if (current is null || !current.RowVersion.AsSpan().SequenceEqual(expectedRowVersion))
            return new LlmTenantBudgetReserveResult { ConcurrencyConflict = true };

        return current.TotalUsdPressure + addUsd > hardCap ? new LlmTenantBudgetReserveResult { HardCapBlocked = true, NewState = current } : new LlmTenantBudgetReserveResult { ConcurrencyConflict = true };
    }

    private async Task<LlmTenantBudgetSettleResult> SettleMonthlyAsync(
        LlmTenantBudgetSettleRequest request,
        CancellationToken cancellationToken)
    {
        using IDbConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        (int sqlYear, int sqlMonth) = await ReadSqlUtcYearMonthAsync(connection, cancellationToken).ConfigureAwait(false);
        (int mintedYear, int mintedMonth) = ParseUtcYearMonth(request.PeriodKey);
        ValidateUtcYearMonth(mintedYear, mintedMonth);
        bool periodKeyMismatch = mintedYear != sqlYear || mintedMonth != sqlMonth;
        string authoritativePeriodKey = FormatUtcYearMonth(sqlYear, sqlMonth);

        if (request is { ActualUsd: 0m, ReleaseReservedUsd: 0m })
        {
            LlmTenantBudgetStateReadModel? cur =
                await SelectMonthlyAsync(connection, request.TenantId, mintedYear, mintedMonth, cancellationToken)
                    .ConfigureAwait(false);

            return cur is null
                ? new LlmTenantBudgetSettleResult { ConcurrencyConflict = true }
                : new LlmTenantBudgetSettleResult
                {
                    NewState = cur,
                    PeriodKeyMismatch = periodKeyMismatch,
                    AuthoritativePeriodKey = periodKeyMismatch ? authoritativePeriodKey : null
                };
        }

        MonthlySettleOutput? output = await connection
            .QuerySingleOrDefaultAsync<MonthlySettleOutput>(
                new CommandDefinition(
                    LlmTenantBudgetSql.SettleMonthly,
                    new
                    {
                        request.TenantId,
                        UtcYear = mintedYear,
                        UtcMonth = mintedMonth,
                        Actual = request.ActualUsd,
                        Release = request.ReleaseReservedUsd,
                        WarnAt = request.WarnAtUsd,
                        RowVersion = request.ExpectedRowVersion
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        if (output is null)
            return new LlmTenantBudgetSettleResult { ConcurrencyConflict = true };

        LlmTenantBudgetStateReadModel model =
            await SelectMonthlyAsync(connection, request.TenantId, mintedYear, mintedMonth, cancellationToken)
                .ConfigureAwait(false)
            ?? throw new InvalidOperationException("Monthly budget row missing after settle.");

        bool shouldAudit = !output.OldWarned && output.OldSpent < request.WarnAtUsd && output.NewSpent >= request.WarnAtUsd;

        return new LlmTenantBudgetSettleResult
        {
            ConcurrencyConflict = false,
            NewState = model,
            ShouldEmitWarnAudit = shouldAudit,
            PeriodKeyMismatch = periodKeyMismatch,
            AuthoritativePeriodKey = periodKeyMismatch ? authoritativePeriodKey : null
        };
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

    private static (int Year, int Month) ParseUtcYearMonth(string periodKey)
    {
        string[] parts = periodKey.Split('-', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (parts.Length != 2)
            throw new FormatException("Monthly period key must be yyyy-MM.");

        int y = int.Parse(parts[0], CultureInfo.InvariantCulture);
        int m = int.Parse(parts[1], CultureInfo.InvariantCulture);

        return (y, m);
    }

    private static string FormatUtcYearMonth(int utcYear, int utcMonth) =>
        string.Format(CultureInfo.InvariantCulture, "{0:0000}-{1:00}", utcYear, utcMonth);

    private static async Task<(int Year, int Month)> ReadSqlUtcYearMonthAsync(
        IDbConnection connection,
        CancellationToken cancellationToken)
    {
        (int Year, int Month) row = await connection
            .QuerySingleAsync<(int Year, int Month)>(
                new CommandDefinition(LlmTenantBudgetSql.SelectSqlUtcYearMonth, cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        ValidateUtcYearMonth(row.Year, row.Month);

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

    private static void ValidateUtcYearMonth(int utcYear, int utcMonth)
    {
        if (utcYear is < 2000 or > 2100)
            throw new ArgumentOutOfRangeException(nameof(utcYear));

        if (utcMonth is < 1 or > 12)
            throw new ArgumentOutOfRangeException(nameof(utcMonth));
    }

    private sealed class MonthlySettleOutput
    {
        public decimal NewSpent
        {
            get; init;
        }

        public bool NewWarned
        {
            get; init;
        }

        public decimal OldSpent
        {
            get; init;
        }

        public bool OldWarned
        {
            get; init;
        }
    }
}
