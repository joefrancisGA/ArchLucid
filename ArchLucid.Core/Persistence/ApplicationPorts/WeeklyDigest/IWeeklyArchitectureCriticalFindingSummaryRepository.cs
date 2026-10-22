namespace ArchLucid.Persistence.WeeklyDigest;

/// <summary>Reads relational <c>FindingRecords</c> linked to snapshots for digest scaffolding jobs.</summary>
public interface IWeeklyArchitectureCriticalFindingSummaryRepository
{
    /// <returns>Approximate totals for all matches plus up to <paramref name="maxSampleRows"/> rows for logging.</returns>
    Task<WeeklyArchitectureCriticalFindingsSlice> ListRecentCriticalAsync(
        DateTime cutoffUtc,
        string criticalSeverityLiteral,
        int maxSampleRows,
        CancellationToken cancellationToken);
}
