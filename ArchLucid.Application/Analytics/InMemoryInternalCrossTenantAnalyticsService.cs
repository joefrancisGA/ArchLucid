using ArchLucid.Core.Analytics;

namespace ArchLucid.Application.Analytics;

/// <summary>In-memory hosts do not model SQL row stores; return an empty-shaped summary.</summary>
public sealed class InMemoryInternalCrossTenantAnalyticsService(
    IInternalCrossTenantRollupRepository rollupRepository,
    InternalCrossTenantRollupProcessor rollupProcessor) : IInternalCrossTenantAnalyticsService
{
    private readonly IInternalCrossTenantRollupRepository _rollupRepository =
        rollupRepository ?? throw new ArgumentNullException(nameof(rollupRepository));

    private readonly InternalCrossTenantRollupProcessor _rollupProcessor =
        rollupProcessor ?? throw new ArgumentNullException(nameof(rollupProcessor));

    /// <inheritdoc />
    public Task<InternalCrossTenantAnalyticsSummary> GetSummaryAsync(CancellationToken cancellationToken = default)
    {
        InternalCrossTenantAnalyticsSummary summary = new()
        {
            CatalogsAggregated = 0,
            TotalRunsNonArchived = 0,
            TotalCompletedRuns = 0,
            AverageCompletedRunDurationSeconds = null,
            TotalEstimatedEngineeringHoursSaved = 0,
        };

        return Task.FromResult(summary);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<InternalCrossTenantRollupDailyRow>> GetDailyRollupsAsync(
        DateOnly rollupDate,
        CancellationToken cancellationToken = default)
    {
        return _rollupRepository.ListDailyRowsAsync(rollupDate, cancellationToken);
    }

    /// <inheritdoc />
    public Task RefreshDailyRollupsAsync(DateOnly rollupDate, CancellationToken cancellationToken = default)
    {
        return _rollupProcessor.RefreshDailyRollupsAsync(rollupDate, cancellationToken);
    }

    /// <inheritdoc />
    public string ExportDailyRollupsCsv(IReadOnlyList<InternalCrossTenantRollupDailyRow> rows) =>
        InternalCrossTenantRollupExportFormatter.ToCsv(rows);

    /// <inheritdoc />
    public string ExportDailyRollupsJson(IReadOnlyList<InternalCrossTenantRollupDailyRow> rows) =>
        InternalCrossTenantRollupExportFormatter.ToJson(rows);
}
