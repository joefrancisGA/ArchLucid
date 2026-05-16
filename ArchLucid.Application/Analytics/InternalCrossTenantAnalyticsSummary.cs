namespace ArchLucid.Application.Analytics;

/// <summary>
///     Anonymized cross-tenant aggregates for internal operators (no per-tenant identifiers).
/// </summary>
public sealed class InternalCrossTenantAnalyticsSummary
{
    /// <summary>Product catalogs included in the rollup (1 in single-catalog mode).</summary>
    public int CatalogsAggregated { get; init; }

    /// <summary>Runs where <c>ArchivedUtc</c> is null.</summary>
    public long TotalRunsNonArchived { get; init; }

    /// <summary>Non-archived runs with a completion timestamp.</summary>
    public long TotalCompletedRuns { get; init; }

    /// <summary>
    ///     Mean wall-clock duration from <c>CreatedUtc</c> to <c>CompletedUtc</c> for completed non-archived runs, or null
    ///     when there are no such runs.
    /// </summary>
    public double? AverageCompletedRunDurationSeconds { get; init; }

    /// <summary>Sum of <c>RunTelemetry.EstimatedHoursSaved</c> when that table exists (engineering-hours proxy).</summary>
    public decimal TotalEstimatedEngineeringHoursSaved { get; init; }
}
