namespace ArchLucid.Core.QuickScan;

/// <summary>Persists Quick Scan usage records for operator dashboards (TB-899).</summary>
public interface IQuickScanUsageRecordStore
{
    Task InsertAsync(QuickScanUsageRecord record, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<QuickScanUsageRecord>> ListRecentAsync(
        int limit,
        CancellationToken cancellationToken = default);
}
