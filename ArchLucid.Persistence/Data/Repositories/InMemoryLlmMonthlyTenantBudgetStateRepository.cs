using System.Collections.Concurrent;

using ArchLucid.Persistence.Data.Repositories.LlmMonthlyTenantBudget;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Process-wide monthly USD bucket for in-memory hosts (parity with <see cref="SqlLlmMonthlyTenantBudgetStateRepository" /> optimism).</summary>
public sealed class InMemoryLlmMonthlyTenantBudgetStateRepository : ILlmMonthlyTenantBudgetStateRepository
{
    private sealed class Row
    {
        public decimal SpentUsd;

        public bool WarnedApproaching;

        public long Version;

        public byte[] RowVersionBytes => System.BitConverter.GetBytes(Version);
    }

    private readonly ConcurrentDictionary<(Guid TenantId, int Year, int Month), Row> _rows = new();

    private readonly ConcurrentDictionary<(Guid TenantId, int Year, int Month), object> _locks = new();

    /// <inheritdoc />
    public Task<LlmMonthlyTenantBudgetStateReadModel> GetOrCreateAsync(
        Guid tenantId,
        int utcYear,
        int utcMonth,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        (Guid, int, int) key = (tenantId, utcYear, utcMonth);
        object gate = _locks.GetOrAdd(key, _ => new object());

        lock (gate)
        {
            Row row = _rows.GetOrAdd(
                key,
                _ => new Row { SpentUsd = 0m, WarnedApproaching = false, Version = 1 });

            return Task.FromResult(ToModel(row));
        }
    }

    /// <inheritdoc />
    public Task<LlmMonthlyTenantBudgetSpendUpdateResult> TryIncrementSpendAsync(
        Guid tenantId,
        int utcYear,
        int utcMonth,
        decimal addUsd,
        decimal warnAtUsd,
        byte[] expectedRowVersion,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(expectedRowVersion);
        cancellationToken.ThrowIfCancellationRequested();

        (Guid, int, int) key = (tenantId, utcYear, utcMonth);
        object gate = _locks.GetOrAdd(key, _ => new object());

        lock (gate)
        {
            if (!_rows.TryGetValue(key, out Row? row))
                return Task.FromResult(new LlmMonthlyTenantBudgetSpendUpdateResult { ConcurrencyConflict = true });

            if (!row.RowVersionBytes.AsSpan().SequenceEqual(expectedRowVersion))
                return Task.FromResult(new LlmMonthlyTenantBudgetSpendUpdateResult { ConcurrencyConflict = true });

            if (addUsd <= 0m)
            {
                return Task.FromResult(
                    new LlmMonthlyTenantBudgetSpendUpdateResult
                    {
                        ConcurrencyConflict = false,
                        NewState = ToModel(row),
                        ShouldEmitWarnAudit = false
                    });
            }

            decimal oldSpent = row.SpentUsd;
            bool oldWarned = row.WarnedApproaching;
            decimal newSpent = oldSpent + addUsd;

            row.SpentUsd = newSpent;

            if (!row.WarnedApproaching && oldSpent < warnAtUsd && newSpent >= warnAtUsd)
                row.WarnedApproaching = true;

            row.Version++;

            bool shouldAudit = !oldWarned && oldSpent < warnAtUsd && newSpent >= warnAtUsd;

            return Task.FromResult(
                new LlmMonthlyTenantBudgetSpendUpdateResult
                {
                    ConcurrencyConflict = false,
                    NewState = ToModel(row),
                    ShouldEmitWarnAudit = shouldAudit
                });
        }
    }

    private static LlmMonthlyTenantBudgetStateReadModel ToModel(Row row)
    {
        return new LlmMonthlyTenantBudgetStateReadModel
        {
            SpentUsd = row.SpentUsd,
            WarnedApproaching = row.WarnedApproaching,
            RowVersion = row.RowVersionBytes
        };
    }
}
