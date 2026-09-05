using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class AuditEvidenceSnapshotVerificationServiceTests
{
    [Fact]
    public async Task TryVerifyAsync_returns_valid_for_untampered_snapshot()
    {
        Guid tenantId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();

        AuditEvidenceSnapshotItemRecord item = BuildItem(snapshotId, tenantId, "stable-summary");
        byte[] itemHash = AuditEvidenceSnapshotHasher.ComputeItemHash(item);
        item = CopyItemWithHash(item, itemHash);

        AuditEvidenceSnapshotHeaderRecord header = new()
        {
            AuditEvidenceSnapshotId = snapshotId,
            AssessmentId = Guid.NewGuid(),
            TenantId = tenantId,
            EvidenceHashSha256 = AuditEvidenceSnapshotHasher.ComputeRootHash([item]),
            CollectionStartedUtc = DateTime.UtcNow,
            CollectionCompletedUtc = DateTime.UtcNow,
            CreatedUtc = DateTime.UtcNow,
        };

        InMemoryAuditEvidenceSnapshotRepository repository = new();
        await repository.InsertSnapshotAsync(new AuditEvidenceSnapshotPersistRequest
        {
            Header = header,
            Items = [item],
        });

        AuditEvidenceSnapshotVerificationService service = new(
            repository,
            NullLogger<AuditEvidenceSnapshotVerificationService>.Instance);

        AuditEvidenceSnapshotVerificationResult result =
            await service.TryVerifyAsync(tenantId, snapshotId);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task TryVerifyAsync_fails_when_item_summary_is_tampered_after_insert()
    {
        Guid tenantId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();

        AuditEvidenceSnapshotItemRecord item = BuildItem(snapshotId, tenantId, "stable-summary");
        item = CopyItemWithHash(item, AuditEvidenceSnapshotHasher.ComputeItemHash(item));

        AuditEvidenceSnapshotHeaderRecord header = new()
        {
            AuditEvidenceSnapshotId = snapshotId,
            AssessmentId = Guid.NewGuid(),
            TenantId = tenantId,
            EvidenceHashSha256 = AuditEvidenceSnapshotHasher.ComputeRootHash([item]),
            CollectionStartedUtc = DateTime.UtcNow,
            CollectionCompletedUtc = DateTime.UtcNow,
            CreatedUtc = DateTime.UtcNow,
        };

        InMemoryAuditEvidenceSnapshotRepository repository = new();
        await repository.InsertSnapshotAsync(new AuditEvidenceSnapshotPersistRequest
        {
            Header = header,
            Items = [item],
        });

        repository.TamperItemSummary(snapshotId, "mutated-summary");

        AuditEvidenceSnapshotVerificationService service = new(
            repository,
            NullLogger<AuditEvidenceSnapshotVerificationService>.Instance);

        AuditEvidenceSnapshotVerificationResult result =
            await service.TryVerifyAsync(tenantId, snapshotId);

        result.IsValid.Should().BeFalse();
        result.FailureReason.Should().Contain("hash");
    }

    private static AuditEvidenceSnapshotItemRecord BuildItem(Guid snapshotId, Guid tenantId, string summary) =>
        new()
        {
            EvidenceRowId = Guid.NewGuid(),
            AuditEvidenceSnapshotId = snapshotId,
            RequirementId = Guid.NewGuid(),
            TenantId = tenantId,
            EvidenceType = AuditEvidenceTypeNames.Inventory,
            CollectedUtc = DateTime.UtcNow,
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

    private static AuditEvidenceSnapshotItemRecord CopyItemWithHash(
        AuditEvidenceSnapshotItemRecord source,
        byte[] evidenceHashSha256) =>
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
            EvidenceHashSha256 = evidenceHashSha256,
            CollectionStatus = source.CollectionStatus,
            FreshnessStatus = source.FreshnessStatus,
            Confidence = source.Confidence,
            Summary = source.Summary,
            ProvenanceKind = source.ProvenanceKind,
            SelectorVersion = source.SelectorVersion,
            AzureScope = source.AzureScope,
            ApiQueryId = source.ApiQueryId,
        };

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

    internal sealed class InMemoryAuditEvidenceSnapshotRepository : IAuditEvidenceSnapshotRepository
    {
        private readonly Dictionary<Guid, AuditEvidenceSnapshotHeaderRecord> _headers = new();
        private readonly Dictionary<Guid, List<AuditEvidenceSnapshotItemRecord>> _items = new();
        private readonly List<AuditEvidenceBaselineRecord> _baselines = [];

        public Task InsertSnapshotAsync(AuditEvidenceSnapshotPersistRequest request, CancellationToken cancellationToken = default)
        {
            _headers[request.Header.AuditEvidenceSnapshotId] = request.Header;
            _items[request.Header.AuditEvidenceSnapshotId] = request.Items.ToList();
            return Task.CompletedTask;
        }

        public Task<AuditEvidenceSnapshotHeaderRecord?> TryGetHeaderAsync(
            Guid tenantId,
            Guid auditEvidenceSnapshotId,
            CancellationToken cancellationToken = default)
        {
            if (_headers.TryGetValue(auditEvidenceSnapshotId, out AuditEvidenceSnapshotHeaderRecord? header)
                && header.TenantId == tenantId)
            {
                return Task.FromResult<AuditEvidenceSnapshotHeaderRecord?>(header);
            }

            return Task.FromResult<AuditEvidenceSnapshotHeaderRecord?>(null);
        }

        public Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListItemsAsync(
            Guid tenantId,
            Guid auditEvidenceSnapshotId,
            CancellationToken cancellationToken = default)
        {
            if (_items.TryGetValue(auditEvidenceSnapshotId, out List<AuditEvidenceSnapshotItemRecord>? items))
                return Task.FromResult<IReadOnlyList<AuditEvidenceSnapshotItemRecord>>(items);

            return Task.FromResult<IReadOnlyList<AuditEvidenceSnapshotItemRecord>>([]);
        }

        public Task<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>> ListByAssessmentAsync(
            Guid tenantId,
            Guid assessmentId,
            CancellationToken cancellationToken = default)
        {
            IReadOnlyList<AuditEvidenceSnapshotHeaderRecord> snapshots = _headers.Values
                .Where(header => header.TenantId == tenantId && header.AssessmentId == assessmentId)
                .OrderByDescending(header => header.CollectionCompletedUtc)
                .ToList();

            return Task.FromResult(snapshots);
        }

        public Task InsertBaselineAsync(AuditEvidenceBaselineRecord baseline, CancellationToken cancellationToken = default)
        {
            _baselines.Add(baseline);
            return Task.CompletedTask;
        }

        public Task<AuditEvidenceBaselineRecord?> TryGetBaselineByNameAsync(
            Guid tenantId,
            Guid assessmentId,
            string baselineName,
            CancellationToken cancellationToken = default)
        {
            AuditEvidenceBaselineRecord? baseline = _baselines.FirstOrDefault(
                row => row.TenantId == tenantId
                    && row.AssessmentId == assessmentId
                    && string.Equals(row.Name, baselineName, StringComparison.Ordinal));

            return Task.FromResult(baseline);
        }

        public void TamperItemSummary(Guid snapshotId, string mutatedSummary)
        {
            if (!_items.TryGetValue(snapshotId, out List<AuditEvidenceSnapshotItemRecord>? items) || items.Count == 0)
                return;

            items[0] = CopyItemWithSummary(items[0], mutatedSummary);
        }
    }
}
