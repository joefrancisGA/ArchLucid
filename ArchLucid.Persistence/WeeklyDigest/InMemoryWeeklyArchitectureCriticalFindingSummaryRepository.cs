namespace ArchLucid.Persistence.WeeklyDigest;

/// <summary>In-memory hosts return an empty slice so digest jobs never touch SQL.</summary>
public sealed class InMemoryWeeklyArchitectureCriticalFindingSummaryRepository : IWeeklyArchitectureCriticalFindingSummaryRepository
{
    /// <inheritdoc />
    public Task<WeeklyArchitectureCriticalFindingsSlice> ListRecentCriticalAsync(
        DateTime cutoffUtc,
        string criticalSeverityLiteral,
        int maxSampleRows,
        CancellationToken cancellationToken)
    {
        _ = cutoffUtc;
        _ = criticalSeverityLiteral;
        _ = maxSampleRows;

        return Task.FromResult(new WeeklyArchitectureCriticalFindingsSlice
        {
            ApproximateMatchingCount = 0,
            SampleRows = [],
        });
    }
}
