using ArchLucid.Contracts.Governance.ComplianceDrift;
using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Governance;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class InMemoryComplianceDriftFindingsTrendReaderCoverageTests
{
    [Fact]
    public async Task GetBucketCountsAsync_aggregates_open_and_resolved_audit_events()
    {
        InMemoryAuditRepository auditRepository = new();
        InMemoryComplianceDriftFindingsTrendReader sut = new(auditRepository);
        Guid tenantId = Guid.NewGuid();
        DateTime fromUtc = new(2026, 7, 10, 0, 0, 0, DateTimeKind.Utc);
        DateTime toUtc = fromUtc.AddHours(2);
        TimeSpan bucketSize = TimeSpan.FromHours(1);

        await auditRepository.AppendAsync(
            new AuditEvent
            {
                TenantId = tenantId,
                EventType = AuditEventTypes.FindingsSnapshotSealed,
                OccurredUtc = fromUtc.AddMinutes(10),
                ActorUserId = "actor",
                ActorUserName = "Actor",
            },
            CancellationToken.None);

        await auditRepository.AppendAsync(
            new AuditEvent
            {
                TenantId = tenantId,
                EventType = AuditEventTypes.FindingReviewApproved,
                OccurredUtc = fromUtc.AddMinutes(20),
                ActorUserId = "actor",
                ActorUserName = "Actor",
            },
            CancellationToken.None);

        IReadOnlyDictionary<DateTime, ComplianceDriftFindingsBucketCounts> buckets =
            await sut.GetBucketCountsAsync(tenantId, fromUtc, toUtc, bucketSize, CancellationToken.None);

        buckets.Should().ContainKey(fromUtc);
        buckets[fromUtc].OpenFindingsCount.Should().Be(1);
        buckets[fromUtc].ResolvedFindingsCount.Should().Be(1);
    }

    [Fact]
    public async Task GetBucketCountsAsync_rejects_invalid_arguments()
    {
        InMemoryComplianceDriftFindingsTrendReader sut = new(new InMemoryAuditRepository());
        DateTime fromUtc = new(2026, 7, 10, 0, 0, 0, DateTimeKind.Utc);
        DateTime toUtc = fromUtc.AddHours(1);

        Func<Task> emptyTenant = () => sut.GetBucketCountsAsync(
            Guid.Empty,
            fromUtc,
            toUtc,
            TimeSpan.FromHours(1),
            CancellationToken.None);

        Func<Task> invalidRange = () => sut.GetBucketCountsAsync(
            Guid.NewGuid(),
            toUtc,
            fromUtc,
            TimeSpan.FromHours(1),
            CancellationToken.None);

        Func<Task> invalidBucket = () => sut.GetBucketCountsAsync(
            Guid.NewGuid(),
            fromUtc,
            toUtc,
            TimeSpan.Zero,
            CancellationToken.None);

        await emptyTenant.Should().ThrowAsync<ArgumentException>();
        await invalidRange.Should().ThrowAsync<ArgumentOutOfRangeException>();
        await invalidBucket.Should().ThrowAsync<ArgumentOutOfRangeException>();
    }
}
