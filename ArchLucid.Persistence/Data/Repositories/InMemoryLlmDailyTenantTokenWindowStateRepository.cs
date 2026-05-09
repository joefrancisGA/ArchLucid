using System.Collections.Concurrent;

using ArchLucid.Persistence.Data.Repositories.LlmDailyTenantTokenWindow;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Process-wide daily token bucket for in-memory hosts (parity with <see cref="SqlLlmDailyTenantTokenWindowStateRepository" /> optimism).</summary>
public sealed class InMemoryLlmDailyTenantTokenWindowStateRepository : ILlmDailyTenantTokenWindowStateRepository
{
    private sealed class Row
    {
        public long TotalTokens;

        public bool WarnedApproaching;

        public long Version;

        public byte[] RowVersionBytes => BitConverter.GetBytes(Version);
    }

    private readonly ConcurrentDictionary<(Guid TenantId, DateOnly UtcDay), Row> _rows = new();

    private readonly ConcurrentDictionary<(Guid TenantId, DateOnly UtcDay), object> _locks = new();

    /// <inheritdoc />
    public Task<LlmDailyTenantTokenWindowStateReadModel> GetOrCreateAsync(
        Guid tenantId,
        DateOnly utcDay,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        (Guid, DateOnly) key = (tenantId, utcDay);
        object gate = _locks.GetOrAdd(key, _ => new object());

        lock (gate)
        {
            Row row = _rows.GetOrAdd(
                key,
                _ => new Row { TotalTokens = 0, WarnedApproaching = false, Version = 1 });

            return Task.FromResult(ToModel(row));
        }
    }

    /// <inheritdoc />
    public Task<LlmDailyTenantTokenWindowTokensUpdateResult> TryIncrementTokensAsync(
        Guid tenantId,
        DateOnly utcDay,
        long addTokens,
        long warnAtTokens,
        byte[] expectedRowVersion,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(expectedRowVersion);
        cancellationToken.ThrowIfCancellationRequested();

        (Guid, DateOnly) key = (tenantId, utcDay);
        object gate = _locks.GetOrAdd(key, _ => new object());

        lock (gate)
        {
            if (!_rows.TryGetValue(key, out Row? row))
                return Task.FromResult(new LlmDailyTenantTokenWindowTokensUpdateResult { ConcurrencyConflict = true });

            if (!row.RowVersionBytes.AsSpan().SequenceEqual(expectedRowVersion))
                return Task.FromResult(new LlmDailyTenantTokenWindowTokensUpdateResult { ConcurrencyConflict = true });

            if (addTokens <= 0)
            {
                return Task.FromResult(
                    new LlmDailyTenantTokenWindowTokensUpdateResult
                    {
                        ConcurrencyConflict = false,
                        NewState = ToModel(row),
                        ShouldEmitWarnAudit = false
                    });
            }

            long oldTotal = row.TotalTokens;
            bool oldWarned = row.WarnedApproaching;
            long newTotal = oldTotal + addTokens;

            row.TotalTokens = newTotal;

            if (!row.WarnedApproaching && oldTotal < warnAtTokens && newTotal >= warnAtTokens)
                row.WarnedApproaching = true;

            row.Version++;

            bool shouldAudit = !oldWarned && oldTotal < warnAtTokens && newTotal >= warnAtTokens;

            return Task.FromResult(
                new LlmDailyTenantTokenWindowTokensUpdateResult
                {
                    ConcurrencyConflict = false,
                    NewState = ToModel(row),
                    ShouldEmitWarnAudit = shouldAudit
                });
        }
    }

    private static LlmDailyTenantTokenWindowStateReadModel ToModel(Row row)
    {
        return new LlmDailyTenantTokenWindowStateReadModel
        {
            TotalTokens = row.TotalTokens,
            WarnedApproaching = row.WarnedApproaching,
            RowVersion = row.RowVersionBytes
        };
    }
}
