using System.Collections.Concurrent;
using System.Globalization;

using ArchLucid.Core.Budgeting;
using ArchLucid.Persistence.Budgeting;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>In-memory <see cref="ILlmTenantBudgetRepository" /> for non-SQL storage modes.</summary>
public sealed class InMemoryLlmTenantBudgetRepository : ILlmTenantBudgetRepository
{
    private readonly ConcurrentDictionary<(Guid TenantId, LlmBudgetPeriod Period, string PeriodKey), LlmTenantBudgetMutableRow> _rows = new();

    private readonly ConcurrentDictionary<(Guid TenantId, LlmBudgetPeriod Period, string PeriodKey), object> _locks = new();

    /// <inheritdoc />
    public Task<LlmTenantBudgetStateReadModel> GetOrCreateAsync(
        Guid tenantId,
        LlmBudgetPeriod period,
        string periodKey,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(periodKey))
            throw new ArgumentException("Period key is required.", nameof(periodKey));

        (Guid, LlmBudgetPeriod, string) key = (tenantId, period, periodKey);
        object gate = _locks.GetOrAdd(key, _ => new object());

        lock (gate)
        {
            LlmTenantBudgetMutableRow row = _rows.GetOrAdd(key, _ => CreateRow());

            return Task.FromResult(ToModel(row));
        }
    }

    /// <inheritdoc />
    public Task<LlmTenantBudgetReserveResult> ReserveAsync(
        LlmTenantBudgetReserveRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.ExpectedRowVersion);
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(request.PeriodKey))
            throw new ArgumentException("Period key is required.", nameof(request));

        (Guid, LlmBudgetPeriod, string) key = (request.TenantId, request.Period, request.PeriodKey);
        object gate = _locks.GetOrAdd(key, _ => new object());

        lock (gate)
        {
            if (!_rows.TryGetValue(key, out LlmTenantBudgetMutableRow? row)
                || !LlmTenantBudgetPeriodCore.RowVersionsMatch(row.RowVersionBytes, request.ExpectedRowVersion))
            {
                return Task.FromResult(new LlmTenantBudgetReserveResult { ConcurrencyConflict = true });
            }

            if (request.Period is LlmBudgetPeriod.Daily or LlmBudgetPeriod.JudgeDaily)
                return Task.FromResult(LlmTenantBudgetReserveCore.TryReserveDaily(row, request, ToModel));

            if (request.Period != LlmBudgetPeriod.Monthly)
                throw new ArgumentOutOfRangeException(nameof(request), request.Period, null);

            (int sqlYear, int sqlMonth) = LlmTenantBudgetPeriodCore.ReadUtcYearMonth();
            (int requestYear, int requestMonth) = LlmTenantBudgetPeriodCore.ParseUtcYearMonth(request.PeriodKey);
            bool periodKeyMismatch = requestYear != sqlYear || requestMonth != sqlMonth;
            string sqlPeriodKey = LlmTenantBudgetPeriodCore.FormatUtcYearMonth(sqlYear, sqlMonth);
            string authoritativePeriodKey = sqlPeriodKey;

            (Guid, LlmBudgetPeriod, string) sqlKey = (request.TenantId, LlmBudgetPeriod.Monthly, sqlPeriodKey);
            object sqlGate = _locks.GetOrAdd(sqlKey, _ => new object());

            lock (sqlGate)
            {
                LlmTenantBudgetMutableRow sqlRow = _rows.GetOrAdd(sqlKey, _ => CreateRow());

                if (!LlmTenantBudgetPeriodCore.RowVersionsMatch(sqlRow.RowVersionBytes, request.ExpectedRowVersion))
                    return Task.FromResult(new LlmTenantBudgetReserveResult { ConcurrencyConflict = true });

                LlmTenantBudgetReserveResult reserveResult =
                    LlmTenantBudgetReserveCore.TryReserveMonthly(sqlRow, request, ToModel);

                if (periodKeyMismatch)
                {
                    return Task.FromResult(
                        new LlmTenantBudgetReserveResult
                        {
                            ConcurrencyConflict = reserveResult.ConcurrencyConflict,
                            HardCapBlocked = reserveResult.HardCapBlocked,
                            NewState = reserveResult.NewState,
                            PeriodKeyMismatch = true,
                            AuthoritativePeriodKey = authoritativePeriodKey
                        });
                }

                return Task.FromResult(reserveResult);
            }
        }
    }

    /// <summary>Test and emergency hook: adds to <see cref="LlmTenantBudgetStateReadModel.PurchasedCapBumpUsd"/> for a monthly period row.</summary>
    public Task ApplyMonthlyPurchasedCapBumpAsync(
        Guid tenantId,
        string periodKey,
        decimal addUsd,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(periodKey))
            throw new ArgumentException("Period key is required.", nameof(periodKey));

        (Guid, LlmBudgetPeriod, string) key = (tenantId, LlmBudgetPeriod.Monthly, periodKey);
        object gate = _locks.GetOrAdd(key, _ => new object());

        lock (gate)
        {
            LlmTenantBudgetMutableRow row = _rows.GetOrAdd(key, _ => CreateRow());

            row.PurchasedCapBumpUsd += addUsd;
            row.Version++;
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<string> GetSqlUtcMonthlyPeriodKeyAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(LlmTenantBudgetPeriodCore.ResolveMonthlyPeriodKey());
    }

    /// <inheritdoc />
    public Task<LlmTenantBudgetSettleResult> SettleAsync(
        LlmTenantBudgetSettleRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.ExpectedRowVersion);
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(request.PeriodKey))
            throw new ArgumentException("Period key is required.", nameof(request));

        (Guid, LlmBudgetPeriod, string) key = (request.TenantId, request.Period, request.PeriodKey);
        object gate = _locks.GetOrAdd(key, _ => new object());

        lock (gate)
        {
            if (!_rows.TryGetValue(key, out LlmTenantBudgetMutableRow? row)
                || !LlmTenantBudgetPeriodCore.RowVersionsMatch(row.RowVersionBytes, request.ExpectedRowVersion))
            {
                return Task.FromResult(new LlmTenantBudgetSettleResult { ConcurrencyConflict = true });
            }

            if (request.Period is LlmBudgetPeriod.Daily or LlmBudgetPeriod.JudgeDaily)
                return Task.FromResult(LlmTenantBudgetSettleCore.TrySettleDaily(row, request, ToModel));

            if (request.Period != LlmBudgetPeriod.Monthly)
                throw new ArgumentOutOfRangeException(nameof(request), request.Period, null);

            (int sqlYear, int sqlMonth) = LlmTenantBudgetPeriodCore.ReadUtcYearMonth();
            (int mintedYear, int mintedMonth) = LlmTenantBudgetPeriodCore.ParseUtcYearMonth(request.PeriodKey);
            bool periodKeyMismatch = mintedYear != sqlYear || mintedMonth != sqlMonth;
            string authoritativePeriodKey = LlmTenantBudgetPeriodCore.FormatUtcYearMonth(sqlYear, sqlMonth);
            (Guid, LlmBudgetPeriod, string) mintedKey = (request.TenantId, LlmBudgetPeriod.Monthly, request.PeriodKey);
            object mintedGate = _locks.GetOrAdd(mintedKey, _ => new object());

            lock (mintedGate)
            {
                LlmTenantBudgetMutableRow mintedRow = _rows.GetOrAdd(mintedKey, _ => CreateRow());

                if (!LlmTenantBudgetPeriodCore.RowVersionsMatch(mintedRow.RowVersionBytes, request.ExpectedRowVersion))
                    return Task.FromResult(new LlmTenantBudgetSettleResult { ConcurrencyConflict = true });

                LlmTenantBudgetSettleResult settleResult =
                    LlmTenantBudgetSettleCore.TrySettleMonthly(mintedRow, request, ToModel);

                if (periodKeyMismatch)
                {
                    return Task.FromResult(
                        new LlmTenantBudgetSettleResult
                        {
                            ConcurrencyConflict = settleResult.ConcurrencyConflict,
                            NewState = settleResult.NewState,
                            ShouldEmitWarnAudit = settleResult.ShouldEmitWarnAudit,
                            PeriodKeyMismatch = true,
                            AuthoritativePeriodKey = authoritativePeriodKey
                        });
                }

                return Task.FromResult(settleResult);
            }
        }
    }

    private static LlmTenantBudgetMutableRow CreateRow() =>
        new()
        {
            TokensConsumed = 0,
            ReservedTokens = 0,
            CommittedUsd = 0m,
            ReservedUsd = 0m,
            PurchasedCapBumpUsd = 0m,
            WarnedApproaching = false,
            Version = 1
        };

    private static LlmTenantBudgetStateReadModel ToModel(LlmTenantBudgetMutableRow row)
    {
        return new LlmTenantBudgetStateReadModel
        {
            TokensConsumed = row.TokensConsumed,
            ReservedTokens = row.ReservedTokens,
            CommittedUsd = decimal.Round(row.CommittedUsd, 6, MidpointRounding.AwayFromZero),
            ReservedUsd = decimal.Round(row.ReservedUsd, 6, MidpointRounding.AwayFromZero),
            PurchasedCapBumpUsd = decimal.Round(row.PurchasedCapBumpUsd, 6, MidpointRounding.AwayFromZero),
            WarnedApproaching = row.WarnedApproaching,
            RowVersion = row.RowVersionBytes
        };
    }
}
