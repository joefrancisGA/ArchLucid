using ArchLucid.Decisioning.Governance.ComplianceDrift;
using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Audit;

namespace ArchLucid.Persistence.Governance;

/// <summary>In-memory findings trend buckets for tests and storage-off mode.</summary>
public sealed class InMemoryComplianceDriftFindingsTrendReader(InMemoryAuditRepository auditRepository)
    : IComplianceDriftFindingsTrendReader
{
    private readonly InMemoryAuditRepository _auditRepository =
        auditRepository ?? throw new ArgumentNullException(nameof(auditRepository));

    /// <inheritdoc />
    public Task<IReadOnlyDictionary<DateTime, ComplianceDriftFindingsBucketCounts>> GetBucketCountsAsync(
        Guid tenantId,
        DateTime fromUtc,
        DateTime toUtc,
        TimeSpan bucketSize,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (fromUtc >= toUtc)
            throw new ArgumentOutOfRangeException(nameof(toUtc));

        if (bucketSize <= TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(nameof(bucketSize));

        IReadOnlyList<AuditEvent> events = _auditRepository.ListByTenantInRange(tenantId, fromUtc, toUtc);
        long bucketTicks = bucketSize.Ticks;
        Dictionary<DateTime, (int Open, int Resolved)> buckets = new();

        foreach (AuditEvent entry in events)
        {
            if (entry.OccurredUtc < fromUtc || entry.OccurredUtc >= toUtc)
                continue;

            if (!IsTrackedEventType(entry.EventType))
                continue;

            long offsetTicks = entry.OccurredUtc.Ticks - fromUtc.Ticks;

            if (offsetTicks < 0)
                continue;

            long bucketIndex = offsetTicks / bucketTicks;
            DateTime bucketUtc = fromUtc.AddTicks(bucketIndex * bucketTicks);

            if (bucketUtc >= toUtc)
                continue;

            if (!buckets.TryGetValue(bucketUtc, out (int Open, int Resolved) counts))
                counts = (0, 0);

            if (ComplianceDriftFindingsTrendAuditTypes.Opened.Contains(entry.EventType, StringComparer.Ordinal))
                counts.Open++;
            else
                counts.Resolved++;

            buckets[bucketUtc] = counts;
        }

        Dictionary<DateTime, ComplianceDriftFindingsBucketCounts> result = buckets.ToDictionary(
            static kv => kv.Key,
            static kv => new ComplianceDriftFindingsBucketCounts
            {
                OpenFindingsCount = kv.Value.Open,
                ResolvedFindingsCount = kv.Value.Resolved,
            });

        return Task.FromResult<IReadOnlyDictionary<DateTime, ComplianceDriftFindingsBucketCounts>>(result);
    }

    private static bool IsTrackedEventType(string eventType) =>
        ComplianceDriftFindingsTrendAuditTypes.Opened.Contains(eventType, StringComparer.Ordinal)
        || ComplianceDriftFindingsTrendAuditTypes.Resolved.Contains(eventType, StringComparer.Ordinal);
}
