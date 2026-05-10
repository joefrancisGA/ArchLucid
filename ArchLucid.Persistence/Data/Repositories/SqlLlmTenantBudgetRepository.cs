using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;

using ArchLucid.Core.Budgeting;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Durable LLM tenant budgets: UTC-day tokens and UTC-month USD with optimistic concurrency.</summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration or in-memory test double.")]
public sealed class SqlLlmTenantBudgetRepository(IDbConnectionFactory connectionFactory) : ILlmTenantBudgetRepository
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<LlmTenantBudgetStateReadModel> GetOrCreateAsync(
        Guid tenantId,
        LlmBudgetPeriod period,
        string periodKey,
        CancellationToken cancellationToken = default)
    {
        return period switch
        {
            LlmBudgetPeriod.Daily => await GetOrCreateDailyAsync(tenantId, periodKey, cancellationToken).ConfigureAwait(false),
            LlmBudgetPeriod.Monthly => await GetOrCreateMonthlyAsync(tenantId, periodKey, cancellationToken).ConfigureAwait(false),
            _ => throw new ArgumentOutOfRangeException(nameof(period), period, null)
        };
    }

    /// <inheritdoc />
    public Task<LlmTenantBudgetReserveResult> ReserveAsync(
        LlmTenantBudgetReserveRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.ExpectedRowVersion);

        if (string.IsNullOrWhiteSpace(request.PeriodKey))
            throw new ArgumentException("Period key is required.", nameof(request));

        return request.Period switch
        {
            LlmBudgetPeriod.Daily => ReserveDailyAsync(request, cancellationToken),
            LlmBudgetPeriod.Monthly => ReserveMonthlyAsync(request, cancellationToken),
            _ => throw new ArgumentOutOfRangeException(nameof(request), request.Period, null)
        };
    }

    /// <inheritdoc />
    public Task<LlmTenantBudgetSettleResult> SettleAsync(
        LlmTenantBudgetSettleRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.ExpectedRowVersion);

        if (string.IsNullOrWhiteSpace(request.PeriodKey))
            throw new ArgumentException("Period key is required.", nameof(request));

        return request.Period switch
        {
            LlmBudgetPeriod.Daily => SettleDailyAsync(request, cancellationToken),
            LlmBudgetPeriod.Monthly => SettleMonthlyAsync(request, cancellationToken),
            _ => throw new ArgumentOutOfRangeException(nameof(request), request.Period, null)
        };
    }

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
        const string insert = """
                              INSERT INTO dbo.LlmDailyTenantTokenWindowState (TenantId, UtcDay, TotalTokens, ReservedAssumedTokens, WarnedApproaching, LastUpdatedUtc)
                              VALUES (@TenantId, @UtcDay, 0, 0, 0, SYSUTCDATETIME());
                              """;

        try
        {
            await connection
                .ExecuteAsync(
                    new CommandDefinition(
                        insert,
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

        const string insert = """
                              INSERT INTO dbo.LlmMonthlyTenantBudgetState (TenantId, UtcYear, UtcMonth, SpentUsd, ReservedAssumedUsd, WarnedApproaching, LastUpdatedUtc)
                              VALUES (@TenantId, @UtcYear, @UtcMonth, 0, 0, 0, SYSUTCDATETIME());
                              """;

        try
        {
            await connection
                .ExecuteAsync(
                    new CommandDefinition(
                        insert,
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

        const string sql = """
                           UPDATE dbo.LlmDailyTenantTokenWindowState
                           SET ReservedAssumedTokens = ReservedAssumedTokens + @Add,
                               LastUpdatedUtc = SYSUTCDATETIME()
                           WHERE TenantId = @TenantId
                             AND UtcDay = @UtcDay
                             AND RowVersion = @RowVersion
                             AND TotalTokens + ReservedAssumedTokens + @Add <= @HardCap;
                           """;

        using IDbConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        int affected = await connection
            .ExecuteAsync(
                new CommandDefinition(
                    sql,
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

        (int utcYear, int utcMonth) = ParseUtcYearMonth(request.PeriodKey);
        ValidateUtcYearMonth(utcYear, utcMonth);

        const string sql = """
                           UPDATE dbo.LlmMonthlyTenantBudgetState
                           SET ReservedAssumedUsd = ReservedAssumedUsd + @Add,
                               LastUpdatedUtc = SYSUTCDATETIME()
                           WHERE TenantId = @TenantId
                             AND UtcYear = @UtcYear
                             AND UtcMonth = @UtcMonth
                             AND RowVersion = @RowVersion
                             AND SpentUsd + ReservedAssumedUsd + @Add <= @HardCap;
                           """;

        using IDbConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        int affected = await connection
            .ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        request.TenantId,
                        UtcYear = utcYear,
                        UtcMonth = utcMonth,
                        Add = request.ReserveUsd,
                        RowVersion = request.ExpectedRowVersion,
                        HardCap = request.HardCapUsd.Value
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        if (affected != 1)
            return await ClassifyMonthlyReserveFailureAsync(
                request.TenantId,
                utcYear,
                utcMonth,
                request.ExpectedRowVersion,
                request.ReserveUsd,
                request.HardCapUsd.Value,
                cancellationToken).ConfigureAwait(false);

        LlmTenantBudgetStateReadModel model =
            await SelectMonthlyAsync(connection, request.TenantId, utcYear, utcMonth, cancellationToken)
                .ConfigureAwait(false)
            ?? throw new InvalidOperationException("Monthly budget row missing after reserve.");

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

        if (current is null)
            return new LlmTenantBudgetReserveResult { ConcurrencyConflict = true };

        if (!current.RowVersion.AsSpan().SequenceEqual(expectedRowVersion))
            return new LlmTenantBudgetReserveResult { ConcurrencyConflict = true };

        return current.TotalTokenPressure + addTokens > hardCap ? new LlmTenantBudgetReserveResult { HardCapBlocked = true, NewState = current } : new LlmTenantBudgetReserveResult { ConcurrencyConflict = true };
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

        if (current is null)
            return new LlmTenantBudgetReserveResult { ConcurrencyConflict = true };

        if (!current.RowVersion.AsSpan().SequenceEqual(expectedRowVersion))
            return new LlmTenantBudgetReserveResult { ConcurrencyConflict = true };

        return current.TotalUsdPressure + addUsd > hardCap ? new LlmTenantBudgetReserveResult { HardCapBlocked = true, NewState = current } : new LlmTenantBudgetReserveResult { ConcurrencyConflict = true };
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

        const string sql = """
                           UPDATE dbo.LlmDailyTenantTokenWindowState
                           SET TotalTokens = TotalTokens + @Actual,
                               ReservedAssumedTokens = ReservedAssumedTokens - @Release,
                               WarnedApproaching = CASE
                                   WHEN WarnedApproaching = 1 THEN 1
                                   WHEN TotalTokens < @WarnAt AND TotalTokens + @Actual >= @WarnAt THEN 1
                                   ELSE WarnedApproaching
                                   END,
                               LastUpdatedUtc = SYSUTCDATETIME()
                           OUTPUT INSERTED.TotalTokens AS NewTotal,
                                  INSERTED.WarnedApproaching AS NewWarned,
                                  DELETED.TotalTokens AS OldTotal,
                                  DELETED.WarnedApproaching AS OldWarned
                           WHERE TenantId = @TenantId
                             AND UtcDay = @UtcDay
                             AND RowVersion = @RowVersion
                             AND ReservedAssumedTokens >= @Release;
                           """;

        using IDbConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        DailySettleOutput? output = await connection
            .QuerySingleOrDefaultAsync<DailySettleOutput>(
                new CommandDefinition(
                    sql,
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

    private async Task<LlmTenantBudgetSettleResult> SettleMonthlyAsync(
        LlmTenantBudgetSettleRequest request,
        CancellationToken cancellationToken)
    {
        (int utcYear, int utcMonth) = ParseUtcYearMonth(request.PeriodKey);
        ValidateUtcYearMonth(utcYear, utcMonth);

        if (request is { ActualUsd: 0m, ReleaseReservedUsd: 0m })
        {
            using IDbConnection c = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);
            LlmTenantBudgetStateReadModel? cur =
                await SelectMonthlyAsync(c, request.TenantId, utcYear, utcMonth, cancellationToken).ConfigureAwait(false);

            return cur is null
                ? new LlmTenantBudgetSettleResult { ConcurrencyConflict = true }
                : new LlmTenantBudgetSettleResult { NewState = cur };
        }

        const string sql = """
                           UPDATE dbo.LlmMonthlyTenantBudgetState
                           SET SpentUsd = SpentUsd + @Actual,
                               ReservedAssumedUsd = ReservedAssumedUsd - @Release,
                               WarnedApproaching = CASE
                                   WHEN WarnedApproaching = 1 THEN 1
                                   WHEN SpentUsd < @WarnAt AND SpentUsd + @Actual >= @WarnAt THEN 1
                                   ELSE WarnedApproaching
                                   END,
                               LastUpdatedUtc = SYSUTCDATETIME()
                           OUTPUT INSERTED.SpentUsd AS NewSpent,
                                  INSERTED.WarnedApproaching AS NewWarned,
                                  DELETED.SpentUsd AS OldSpent,
                                  DELETED.WarnedApproaching AS OldWarned
                           WHERE TenantId = @TenantId
                             AND UtcYear = @UtcYear
                             AND UtcMonth = @UtcMonth
                             AND RowVersion = @RowVersion
                             AND ReservedAssumedUsd >= @Release;
                           """;

        using IDbConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        MonthlySettleOutput? output = await connection
            .QuerySingleOrDefaultAsync<MonthlySettleOutput>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        request.TenantId,
                        UtcYear = utcYear,
                        UtcMonth = utcMonth,
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
            await SelectMonthlyAsync(connection, request.TenantId, utcYear, utcMonth, cancellationToken)
                .ConfigureAwait(false)
            ?? throw new InvalidOperationException("Monthly budget row missing after settle.");

        bool shouldAudit = !output.OldWarned && output.OldSpent < request.WarnAtUsd && output.NewSpent >= request.WarnAtUsd;

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
        const string sel = """
                           SELECT TotalTokens AS TokensConsumed,
                                  ReservedAssumedTokens AS ReservedTokens,
                                  CAST(0 AS DECIMAL(18, 6)) AS CommittedUsd,
                                  CAST(0 AS DECIMAL(18, 6)) AS ReservedUsd,
                                  WarnedApproaching,
                                  RowVersion
                           FROM dbo.LlmDailyTenantTokenWindowState
                           WHERE TenantId = @TenantId AND UtcDay = @UtcDay;
                           """;

        return connection.QuerySingleOrDefaultAsync<LlmTenantBudgetStateReadModel>(
            new CommandDefinition(sel, new
            {
                TenantId = tenantId,
                UtcDay = utcDayDate
            }, cancellationToken: cancellationToken));
    }

    private static Task<LlmTenantBudgetStateReadModel?> SelectMonthlyAsync(
        IDbConnection connection,
        Guid tenantId,
        int utcYear,
        int utcMonth,
        CancellationToken cancellationToken)
    {
        const string sel = """
                           SELECT CAST(0 AS BIGINT) AS TokensConsumed,
                                  CAST(0 AS BIGINT) AS ReservedTokens,
                                  SpentUsd AS CommittedUsd,
                                  ReservedAssumedUsd AS ReservedUsd,
                                  WarnedApproaching,
                                  RowVersion
                           FROM dbo.LlmMonthlyTenantBudgetState
                           WHERE TenantId = @TenantId AND UtcYear = @UtcYear AND UtcMonth = @UtcMonth;
                           """;

        return connection.QuerySingleOrDefaultAsync<LlmTenantBudgetStateReadModel>(
            new CommandDefinition(
                sel,
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

    private static void ValidateUtcYearMonth(int utcYear, int utcMonth)
    {
        if (utcYear is < 2000 or > 2100)
            throw new ArgumentOutOfRangeException(nameof(utcYear));

        if (utcMonth is < 1 or > 12)
            throw new ArgumentOutOfRangeException(nameof(utcMonth));
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
