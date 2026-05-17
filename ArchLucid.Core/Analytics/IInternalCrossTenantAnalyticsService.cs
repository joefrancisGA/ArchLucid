namespace ArchLucid.Core.Analytics;

/// <summary>
///     Internal-only aggregates across tenant boundaries (RLS bypass or per-catalog fan-out; never exposed to tenant APIs).
/// </summary>
public interface IInternalCrossTenantAnalyticsService
{
    Task<InternalCrossTenantAnalyticsSummary> GetSummaryAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<InternalCrossTenantRollupDailyRow>> GetDailyRollupsAsync(
        DateOnly rollupDate,
        CancellationToken cancellationToken = default);

    Task RefreshDailyRollupsAsync(
        DateOnly rollupDate,
        CancellationToken cancellationToken = default);

    string ExportDailyRollupsCsv(IReadOnlyList<InternalCrossTenantRollupDailyRow> rows);

    string ExportDailyRollupsJson(IReadOnlyList<InternalCrossTenantRollupDailyRow> rows);
}
