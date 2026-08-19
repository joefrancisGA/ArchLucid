using ArchLucid.Contracts.Governance.ComplianceDrift;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Buckets durable audit events that represent findings opened vs human-disposition resolved.</summary>
public interface IComplianceDriftFindingsTrendReader
{
    Task<IReadOnlyDictionary<DateTime, ComplianceDriftFindingsBucketCounts>> GetBucketCountsAsync(
        Guid tenantId,
        DateTime fromUtc,
        DateTime toUtc,
        TimeSpan bucketSize,
        CancellationToken cancellationToken = default);
}
