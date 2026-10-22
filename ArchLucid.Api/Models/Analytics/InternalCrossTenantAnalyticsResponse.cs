namespace ArchLucid.Api.Models.Analytics;

/// <summary>Wire payload for <c>GET /v1/internal/analytics/cross-tenant</c> — anonymized operator aggregates.</summary>
public sealed class InternalCrossTenantAnalyticsResponse
{
    public int CatalogsAggregated { get; init; }

    public long TotalRunsNonArchived { get; init; }

    public long TotalCompletedRuns { get; init; }

    public double? AverageCompletedRunDurationSeconds { get; init; }

    public decimal TotalEstimatedEngineeringHoursSaved { get; init; }
}
