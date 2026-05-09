using System.Collections.Concurrent;

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
            if (!_rows.TryGetValue(key, out Row? row))
                return Task.FromResult(new LlmTenantBudgetReserveResult { ConcurrencyConflict = true });

            if (!row.RowVersionBytes.AsSpan().SequenceEqual(request.ExpectedRowVersion))
                return Task.FromResult(new LlmTenantBudgetReserveResult { ConcurrencyConflict = true });

            if (request.Period == LlmBudgetPeriod.Daily)
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

            if (request.Period == LlmBudgetPeriod.Monthly)
            {
                if (request.ReserveUsd <= 0m)
                    return Task.FromResult(new LlmTenantBudgetReserveResult { NewState = ToModel(row) });

                if (request.HardCapUsd is null)
                    throw new ArgumentException("HardCapUsd is required for monthly reserve.", nameof(request));

                if (row.CommittedUsd + row.ReservedUsd + request.ReserveUsd > request.HardCapUsd.Value)
                    return Task.FromResult(
                        new LlmTenantBudgetReserveResult { HardCapBlocked = true, NewState = ToModel(row) });

                row.ReservedUsd += request.ReserveUsd;
                row.Version++;

                return Task.FromResult(new LlmTenantBudgetReserveResult { NewState = ToModel(row) });
            }

            throw new ArgumentOutOfRangeException(nameof(request), request.Period, null);
        }
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
            if (!_rows.TryGetValue(key, out Row? row))
                return Task.FromResult(new LlmTenantBudgetSettleResult { ConcurrencyConflict = true });

            if (!row.RowVersionBytes.AsSpan().SequenceEqual(request.ExpectedRowVersion))
                return Task.FromResult(new LlmTenantBudgetSettleResult { ConcurrencyConflict = true });

            if (request.Period == LlmBudgetPeriod.Daily)
            {
                if (request.ReleaseReservedTokens > row.ReservedTokens)
                    return Task.FromResult(new LlmTenantBudgetSettleResult { ConcurrencyConflict = true });

                if (request.ActualTokens == 0 && request.ReleaseReservedTokens == 0)
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

            if (request.Period == LlmBudgetPeriod.Monthly)
            {
                if (request.ReleaseReservedUsd > row.ReservedUsd)
                    return Task.FromResult(new LlmTenantBudgetSettleResult { ConcurrencyConflict = true });

                if (request.ActualUsd == 0m && request.ReleaseReservedUsd == 0m)
                    return Task.FromResult(new LlmTenantBudgetSettleResult { NewState = ToModel(row) });

                decimal oldSpent = row.CommittedUsd;
                bool oldWarned = row.WarnedApproaching;

                row.CommittedUsd += request.ActualUsd;
                row.ReservedUsd -= request.ReleaseReservedUsd;

                if (!row.WarnedApproaching && oldSpent < request.WarnAtUsd && row.CommittedUsd >= request.WarnAtUsd)
                    row.WarnedApproaching = true;

                row.Version++;

                bool shouldAudit = !oldWarned && oldSpent < request.WarnAtUsd && row.CommittedUsd >= request.WarnAtUsd;

                return Task.FromResult(
                    new LlmTenantBudgetSettleResult { NewState = ToModel(row), ShouldEmitWarnAudit = shouldAudit });
            }

            throw new ArgumentOutOfRangeException(nameof(request), request.Period, null);
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
            WarnedApproaching = row.WarnedApproaching,
            RowVersion = row.RowVersionBytes
        };
    }
}
