using ArchLucid.Core.Analytics;

namespace ArchLucid.Application.Analytics;

/// <summary>In-memory hosts do not model SQL row stores; return an empty-shaped summary.</summary>
public sealed class InMemoryInternalCrossTenantAnalyticsService : IInternalCrossTenantAnalyticsService
{
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
}
