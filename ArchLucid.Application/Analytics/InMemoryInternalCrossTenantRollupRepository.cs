using System.Collections.Concurrent;

using ArchLucid.Core.Analytics;

namespace ArchLucid.Application.Analytics;

/// <summary>In-memory rollup store for tests and InMemory storage hosts.</summary>
public sealed class InMemoryInternalCrossTenantRollupRepository : IInternalCrossTenantRollupRepository
{
    private readonly ConcurrentDictionary<(DateOnly RollupDate, string AnalyticsTenantKey), InternalCrossTenantRollupDailyRow> _rows =
        new();

    /// <inheritdoc />
    public Task UpsertDailyRowsAsync(
        IReadOnlyList<InternalCrossTenantRollupDailyRow> rows,
        CancellationToken cancellationToken = default)
    {
        foreach (InternalCrossTenantRollupDailyRow row in rows)
            _rows[(row.RollupDate, row.AnalyticsTenantKey)] = row;

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<InternalCrossTenantRollupDailyRow>> ListDailyRowsAsync(
        DateOnly rollupDate,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<InternalCrossTenantRollupDailyRow> rows = _rows.Values
            .Where(row => row.RollupDate == rollupDate)
            .OrderBy(row => row.AnalyticsTenantKey, StringComparer.Ordinal)
            .ToList();

        return Task.FromResult(rows);
    }
}
