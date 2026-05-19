namespace ArchLucid.Decisioning.Governance.ComplianceDrift;

/// <summary>
///     Buckets durable audit events that represent findings opened vs human-disposition resolved (read-only).
/// </summary>
/// <remarks>
///     Implemented by <c>ArchLucid.Persistence.Governance.DapperComplianceDriftFindingsTrendReader</c> and
///     <c>InMemoryComplianceDriftFindingsTrendReader</c>.
/// </remarks>
public interface IComplianceDriftFindingsTrendReader
{
    /// <summary>
    ///     Returns per-bucket counts keyed by bucket start UTC (aligned with compliance drift trend bucketing).
    /// </summary>
    Task<IReadOnlyDictionary<DateTime, ComplianceDriftFindingsBucketCounts>> GetBucketCountsAsync(
        Guid tenantId,
        DateTime fromUtc,
        DateTime toUtc,
        TimeSpan bucketSize,
        CancellationToken cancellationToken = default);
}

/// <summary>Findings opened vs resolved in one compliance-drift time bucket.</summary>
public sealed class ComplianceDriftFindingsBucketCounts
{
    public int OpenFindingsCount
    {
        get;
        init;
    }

    public int ResolvedFindingsCount
    {
        get;
        init;
    }
}
