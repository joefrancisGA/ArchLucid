using System.Collections.Concurrent;
using System.Globalization;

using ArchLucid.Core.Budgeting;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>In-memory <see cref="ILlmTenantBudgetRepository" /> for non-SQL storage modes.</summary>
public sealed class InMemoryLlmTenantBudgetRepository : ILlmTenantBudgetRepository
{
    private sealed class Row
    {
        public long TokensConsumed;

        public long ReservedTokens;

        public decimal CommittedUsd;

        public decimal ReservedUsd;

        public decimal PurchasedCapBumpUsd;

        public bool WarnedApproaching;

        public long Version;

        public byte[] RowVersionBytes => BitConverter.GetBytes(Version);
    }

    private readonly ConcurrentDictionary<(Guid TenantId, LlmBudgetPeriod Period, string PeriodKey), Row> _rows = new();

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
            Row row = _rows.GetOrAdd(
                key,
                _ => new Row
                {
                    TokensConsumed = 0,
                    ReservedTokens = 0,
                    CommittedUsd = 0m,
                    ReservedUsd = 0m,
                    PurchasedCapBumpUsd = 0m,
                    WarnedApproaching = false,
                    Version = 1
                });

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
            if (!_rows.TryGetValue(key, out Row? row) || !row.RowVersionBytes.AsSpan().SequenceEqual(request.ExpectedRowVersion))
                return Task.FromResult(new LlmTenantBudgetReserveResult { ConcurrencyConflict = true });

            if (request.Period is LlmBudgetPeriod.Daily or LlmBudgetPeriod.JudgeDaily)
            {
                if (request.ReserveTokens < 1)
                    return Task.FromResult(new LlmTenantBudgetReserveResult { NewState = ToModel(row) });

                if (request.HardCapTokens is null)
                    throw new ArgumentException("HardCapTokens is required for daily reserve.", nameof(request));

                if (row.TokensConsumed + row.ReservedTokens + request.ReserveTokens > request.HardCapTokens.Value)
                    return Task.FromResult(
                        new LlmTenantBudgetReserveResult { HardCapBlocked = true, NewState = ToModel(row) });

                row.ReservedTokens += request.ReserveTokens;
                row.Version++;

                return Task.FromResult(new LlmTenantBudgetReserveResult { NewState = ToModel(row) });
            }

            if (request.Period != LlmBudgetPeriod.Monthly)
                throw new ArgumentOutOfRangeException(nameof(request), request.Period, null);

            if (request.ReserveUsd <= 0m)
                return Task.FromResult(new LlmTenantBudgetReserveResult { NewState = ToModel(row) });

            if (request.HardCapUsd is null)
                throw new ArgumentException("HardCapUsd is required for monthly reserve.", nameof(request));

            (int sqlYear, int sqlMonth) = ReadUtcYearMonth();
            (int requestYear, int requestMonth) = ParseUtcYearMonth(request.PeriodKey);
            bool periodKeyMismatch = requestYear != sqlYear || requestMonth != sqlMonth;
            string sqlPeriodKey = FormatUtcYearMonth(sqlYear, sqlMonth);
            string authoritativePeriodKey = sqlPeriodKey;

            (Guid, LlmBudgetPeriod, string) sqlKey = (request.TenantId, LlmBudgetPeriod.Monthly, sqlPeriodKey);
            object sqlGate = _locks.GetOrAdd(sqlKey, _ => new object());

            lock (sqlGate)
            {
                Row sqlRow = _rows.GetOrAdd(
                    sqlKey,
                    _ => new Row
                    {
                        TokensConsumed = 0,
                        ReservedTokens = 0,
                        CommittedUsd = 0m,
                        ReservedUsd = 0m,
                        PurchasedCapBumpUsd = 0m,
                        WarnedApproaching = false,
                        Version = 1
                    });

                if (!sqlRow.RowVersionBytes.AsSpan().SequenceEqual(request.ExpectedRowVersion))
                    return Task.FromResult(new LlmTenantBudgetReserveResult { ConcurrencyConflict = true });

                if (sqlRow.CommittedUsd + sqlRow.ReservedUsd + request.ReserveUsd > request.HardCapUsd.Value)
                {
                    return Task.FromResult(
                        new LlmTenantBudgetReserveResult
                        {
                            HardCapBlocked = true,
                            NewState = ToModel(sqlRow),
                            PeriodKeyMismatch = periodKeyMismatch,
                            AuthoritativePeriodKey = periodKeyMismatch ? authoritativePeriodKey : null
                        });
                }

                sqlRow.ReservedUsd += request.ReserveUsd;
                sqlRow.Version++;

                return Task.FromResult(
                    new LlmTenantBudgetReserveResult
                    {
                        NewState = ToModel(sqlRow),
                        PeriodKeyMismatch = periodKeyMismatch,
                        AuthoritativePeriodKey = periodKeyMismatch ? authoritativePeriodKey : null
                    });
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
            Row row = _rows.GetOrAdd(
                key,
                _ => new Row
                {
                    TokensConsumed = 0,
                    ReservedTokens = 0,
                    CommittedUsd = 0m,
                    ReservedUsd = 0m,
                    PurchasedCapBumpUsd = 0m,
                    WarnedApproaching = false,
                    Version = 1
                });

            row.PurchasedCapBumpUsd += addUsd;
            row.Version++;
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<string> GetSqlUtcMonthlyPeriodKeyAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        DateTime utc = TimeProvider.System.UtcNowDateTime();

        return Task.FromResult(string.Format(CultureInfo.InvariantCulture, "{0:0000}-{1:00}", utc.Year, utc.Month));
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
            if (!_rows.TryGetValue(key, out Row? row) || !row.RowVersionBytes.AsSpan().SequenceEqual(request.ExpectedRowVersion))
                return Task.FromResult(new LlmTenantBudgetSettleResult { ConcurrencyConflict = true });

            if (request.Period is LlmBudgetPeriod.Daily or LlmBudgetPeriod.JudgeDaily)
            {
                if (request.ReleaseReservedTokens > row.ReservedTokens)
                    return Task.FromResult(new LlmTenantBudgetSettleResult { ConcurrencyConflict = true });

                if (request is { ActualTokens: 0, ReleaseReservedTokens: 0 })
                    return Task.FromResult(new LlmTenantBudgetSettleResult { NewState = ToModel(row) });

                long oldTotal = row.TokensConsumed;
                bool oldWarned = row.WarnedApproaching;

                row.TokensConsumed += request.ActualTokens;
                row.ReservedTokens -= request.ReleaseReservedTokens;

                if (!row.WarnedApproaching && oldTotal < request.WarnAtTokens
                    && row.TokensConsumed >= request.WarnAtTokens)
                    row.WarnedApproaching = true;

                row.Version++;

                bool shouldAudit = !oldWarned && oldTotal < request.WarnAtTokens
                    && row.TokensConsumed >= request.WarnAtTokens;

                return Task.FromResult(
                    new LlmTenantBudgetSettleResult { NewState = ToModel(row), ShouldEmitWarnAudit = shouldAudit });
            }

            if (request.Period != LlmBudgetPeriod.Monthly)
                throw new ArgumentOutOfRangeException(nameof(request), request.Period, null);

            (int sqlYear, int sqlMonth) = ReadUtcYearMonth();
            (int mintedYear, int mintedMonth) = ParseUtcYearMonth(request.PeriodKey);
            bool periodKeyMismatch = mintedYear != sqlYear || mintedMonth != sqlMonth;
            string authoritativePeriodKey = FormatUtcYearMonth(sqlYear, sqlMonth);
            (Guid, LlmBudgetPeriod, string) mintedKey = (request.TenantId, LlmBudgetPeriod.Monthly, request.PeriodKey);
            object mintedGate = _locks.GetOrAdd(mintedKey, _ => new object());

            lock (mintedGate)
            {
                Row mintedRow = _rows.GetOrAdd(
                    mintedKey,
                    _ => new Row
                    {
                        TokensConsumed = 0,
                        ReservedTokens = 0,
                        CommittedUsd = 0m,
                        ReservedUsd = 0m,
                        PurchasedCapBumpUsd = 0m,
                        WarnedApproaching = false,
                        Version = 1
                    });

                if (!mintedRow.RowVersionBytes.AsSpan().SequenceEqual(request.ExpectedRowVersion))
                    return Task.FromResult(new LlmTenantBudgetSettleResult { ConcurrencyConflict = true });

                if (request.ReleaseReservedUsd > mintedRow.ReservedUsd)
                    return Task.FromResult(new LlmTenantBudgetSettleResult { ConcurrencyConflict = true });

                if (request is { ActualUsd: 0m, ReleaseReservedUsd: 0m })
                {
                    return Task.FromResult(
                        new LlmTenantBudgetSettleResult
                        {
                            NewState = ToModel(mintedRow),
                            PeriodKeyMismatch = periodKeyMismatch,
                            AuthoritativePeriodKey = periodKeyMismatch ? authoritativePeriodKey : null
                        });
                }

                decimal oldSpent = mintedRow.CommittedUsd;
                bool oldWarned = mintedRow.WarnedApproaching;

                mintedRow.CommittedUsd += request.ActualUsd;
                mintedRow.ReservedUsd -= request.ReleaseReservedUsd;

                if (!mintedRow.WarnedApproaching && oldSpent < request.WarnAtUsd && mintedRow.CommittedUsd >= request.WarnAtUsd)
                    mintedRow.WarnedApproaching = true;

                mintedRow.Version++;

                bool shouldAudit = !oldWarned && oldSpent < request.WarnAtUsd && mintedRow.CommittedUsd >= request.WarnAtUsd;

                return Task.FromResult(
                    new LlmTenantBudgetSettleResult
                    {
                        NewState = ToModel(mintedRow),
                        ShouldEmitWarnAudit = shouldAudit,
                        PeriodKeyMismatch = periodKeyMismatch,
                        AuthoritativePeriodKey = periodKeyMismatch ? authoritativePeriodKey : null
                    });
            }

        }
    }

    private static LlmTenantBudgetStateReadModel ToModel(Row row)
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

    private static (int Year, int Month) ReadUtcYearMonth()
    {
        DateTime utc = TimeProvider.System.UtcNowDateTime();

        return (utc.Year, utc.Month);
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
}
