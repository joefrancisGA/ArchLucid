using System.Collections.Concurrent;

using ArchLucid.Core.QuickScan;

namespace ArchLucid.Application.Architecture;

/// <summary>In-memory Quick Scan usage records for simulator/tests (TB-899).</summary>
public sealed class InMemoryQuickScanUsageRecordStore : IQuickScanUsageRecordStore
{
    private readonly ConcurrentQueue<QuickScanUsageRecord> _records = new();

    /// <inheritdoc />
    public Task InsertAsync(QuickScanUsageRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        _records.Enqueue(record);

        while (_records.Count > 500 && _records.TryDequeue(out _))
        {
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<QuickScanUsageRecord>> ListRecentAsync(
        int limit,
        CancellationToken cancellationToken = default)
    {
        int take = Math.Clamp(limit, 1, 100);

        IReadOnlyList<QuickScanUsageRecord> recent = _records
            .Reverse()
            .Take(take)
            .ToList();

        return Task.FromResult(recent);
    }
}
