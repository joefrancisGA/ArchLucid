namespace ArchLucid.Persistence.Queries;

/// <summary>Scope-wide ROI rollup across run telemetry rows (directional, configured multipliers upstream).</summary>
public sealed record RunRoiTelemetryAggregate(long TotalRuns, decimal TotalHoursSaved, long AverageTimeToCommitMs)
{
    /// <summary>Rollup for a scope with no telemetry rows yet.</summary>
    public static RunRoiTelemetryAggregate Empty { get; } = new(0L, 0m, 0L);
}
