using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class AuditEvidenceSnapshotHasherTests
{
    [Fact]
    public void ComputeRootHash_is_deterministic_for_same_items()
    {
        AuditEvidenceSnapshotItemRecord item = BuildItem("summary-a");

        byte[] first = AuditEvidenceSnapshotHasher.ComputeRootHash([item]);
        byte[] second = AuditEvidenceSnapshotHasher.ComputeRootHash([item]);

        AuditEvidenceSnapshotHasher.HashesEqual(first, second).Should().BeTrue();
    }

    [Fact]
    public void ComputeItemHash_changes_when_summary_mutates()
    {
        AuditEvidenceSnapshotItemRecord original = BuildItem("summary-a");
        AuditEvidenceSnapshotItemRecord mutated = CopyItemWithSummary(original, "summary-b");

        byte[] originalHash = AuditEvidenceSnapshotHasher.ComputeItemHash(original);
        byte[] mutatedHash = AuditEvidenceSnapshotHasher.ComputeItemHash(mutated);

        AuditEvidenceSnapshotHasher.HashesEqual(originalHash, mutatedHash).Should().BeFalse();
    }

    [Fact]
    public void ComputeRootHash_uses_empty_snapshot_sentinel_when_no_items()
    {
        byte[] root = AuditEvidenceSnapshotHasher.ComputeRootHash([]);

        root.Should().HaveCount(32);
    }

    private static AuditEvidenceSnapshotItemRecord CopyItemWithSummary(
        AuditEvidenceSnapshotItemRecord source,
        string summary) =>
        new()
        {
            EvidenceRowId = source.EvidenceRowId,
            AuditEvidenceSnapshotId = source.AuditEvidenceSnapshotId,
            RequirementId = source.RequirementId,
            TenantId = source.TenantId,
            CloudResourceId = source.CloudResourceId,
            AzureResourceId = source.AzureResourceId,
            EvidenceType = source.EvidenceType,
            CollectedUtc = source.CollectedUtc,
            CollectorVersion = source.CollectorVersion,
            NormalizedPointer = source.NormalizedPointer,
            RawPointer = source.RawPointer,
            EvidenceHashSha256 = source.EvidenceHashSha256,
            CollectionStatus = source.CollectionStatus,
            FreshnessStatus = source.FreshnessStatus,
            Confidence = source.Confidence,
            Summary = summary,
            ProvenanceKind = source.ProvenanceKind,
            SelectorVersion = source.SelectorVersion,
            AzureScope = source.AzureScope,
            ApiQueryId = source.ApiQueryId,
        };

    private static AuditEvidenceSnapshotItemRecord BuildItem(string summary) =>
        new()
        {
            EvidenceRowId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            AuditEvidenceSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            RequirementId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            TenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            EvidenceType = AuditEvidenceTypeNames.Inventory,
            CollectedUtc = new DateTime(2026, 9, 4, 12, 0, 0, DateTimeKind.Utc),
            CollectorVersion = "1.0.0",
            NormalizedPointer = "inventory:inv/resource:res",
            RawPointer = "package:pkg",
            CollectionStatus = AuditEvidenceCollectionStatus.Collected,
            FreshnessStatus = AuditEvidenceFreshnessStatus.Unknown,
            Confidence = 1.0m,
            Summary = summary,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            SelectorVersion = "1.0.0",
        };
}
