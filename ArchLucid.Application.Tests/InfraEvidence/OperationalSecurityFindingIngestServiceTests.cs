using ArchLucid.Application.InfraEvidence.OperationalSecurityFindings;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class OperationalSecurityFindingIngestServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
    private static readonly Guid WorkspaceId = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2");
    private static readonly Guid ProjectId = Guid.Parse("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3");

    [Fact]
    public async Task IngestBatchAsync_same_payload_twice_marks_second_item_deduplicated()
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        OperationalSecurityFindingIngestService sut = new(
            repository,
            auditService.Object,
            NullLogger<OperationalSecurityFindingIngestService>.Instance);

        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

        OperationalSecurityFindingIngestItem item = CreateItem("scanner-a", "finding-100");

        OperationalSecurityFindingBatchIngestResult first = await sut.IngestBatchAsync(
            scope,
            [item],
            "actor@test",
            CancellationToken.None);

        OperationalSecurityFindingBatchIngestResult second = await sut.IngestBatchAsync(
            scope,
            [item],
            "actor@test",
            CancellationToken.None);

        first.IngestedCount.Should().Be(1);
        first.DeduplicatedCount.Should().Be(0);
        first.Items[0].FindingId.Should().NotBeNull();

        second.DeduplicatedCount.Should().Be(1);
        second.IngestedCount.Should().Be(0);
        second.Items[0].WasDeduplicated.Should().BeTrue();
        second.Items[0].FindingId.Should().Be(first.Items[0].FindingId);

        repository.StoredFindings.Should().HaveCount(1);
        repository.StoredObservations.Should().HaveCount(1);
    }

    [Fact]
    public async Task TryGetDetailAsync_foreign_tenant_returns_not_found()
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        Mock<IAuditService> auditService = new();

        OperationalSecurityFindingIngestService sut = new(
            repository,
            auditService.Object,
            NullLogger<OperationalSecurityFindingIngestService>.Instance);

        ScopeContext scopeA = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };
        ScopeContext scopeB = new()
        {
            TenantId = Guid.Parse("d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4"),
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

        OperationalSecurityFindingBatchIngestResult ingest = await sut.IngestBatchAsync(
            scopeA,
            [CreateItem("scanner-b", "finding-200")],
            "actor@test",
            CancellationToken.None);

        Guid findingId = ingest.Items[0].FindingId!.Value;

        OperationalSecurityFindingDetailResult detail = await sut.TryGetDetailAsync(scopeB, findingId);

        detail.Succeeded.Should().BeFalse();
        detail.Finding.Should().BeNull();
    }

    private static OperationalSecurityFindingIngestItem CreateItem(string sourceSystem, string sourceFindingId) =>
        new()
        {
            Provider = CloudProvider.Azure,
            SourceSystem = sourceSystem,
            SourceFindingId = sourceFindingId,
            Title = "Unencrypted disk",
            Severity = "High",
            Status = OperationalSecurityFindingStatus.Open,
        };

    private sealed class InMemoryOperationalSecurityFindingRepository : IOperationalSecurityFindingRepository
    {
        public List<OperationalSecurityFindingRecord> StoredFindings { get; } = [];

        public List<OperationalSecurityFindingObservationRecord> StoredObservations { get; } = [];

        public List<OperationalSecurityFindingMetadataRecord> StoredMetadata { get; } = [];

        public Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyAsync(
            Guid tenantId,
            CloudProvider provider,
            string sourceSystem,
            string sourceFindingId,
            CancellationToken cancellationToken = default)
        {
            OperationalSecurityFindingRecord? match = StoredFindings.FirstOrDefault(finding =>
                finding.TenantId == tenantId
                && finding.Provider == provider
                && finding.SourceSystem == sourceSystem
                && finding.SourceFindingId == sourceFindingId);

            return Task.FromResult(match);
        }

        public Task<OperationalSecurityFindingRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default)
        {
            OperationalSecurityFindingRecord? match = StoredFindings.FirstOrDefault(finding =>
                finding.TenantId == tenantId && finding.FindingId == findingId);

            return Task.FromResult(match);
        }

        public Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByTenantAsync(
            Guid tenantId,
            OperationalSecurityFindingStatus? status,
            CancellationToken cancellationToken = default)
        {
            IEnumerable<OperationalSecurityFindingRecord> query = StoredFindings.Where(finding => finding.TenantId == tenantId);

            if (status.HasValue)
                query = query.Where(finding => finding.Status == status.Value);

            return Task.FromResult<IReadOnlyList<OperationalSecurityFindingRecord>>(query.ToList());
        }

        public Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingMetadataRecord>>(
                StoredMetadata
                    .Where(row => row.TenantId == tenantId && row.FindingId == findingId)
                    .ToList());

        public Task<IReadOnlyList<OperationalSecurityFindingObservationRecord>> ListObservationsByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingObservationRecord>>(
                StoredObservations
                    .Where(row => row.TenantId == tenantId && row.FindingId == findingId)
                    .ToList());

        public Task InsertAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord observation,
            CancellationToken cancellationToken = default)
        {
            StoredFindings.Add(finding);
            StoredMetadata.AddRange(metadata);
            StoredObservations.Add(observation);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord? observation,
            CancellationToken cancellationToken = default)
        {
            int index = StoredFindings.FindIndex(row => row.FindingId == finding.FindingId);

            if (index >= 0)
                StoredFindings[index] = finding;

            foreach (OperationalSecurityFindingMetadataRecord row in metadata)
            {
                int metadataIndex = StoredMetadata.FindIndex(candidate =>
                    candidate.TenantId == row.TenantId
                    && candidate.FindingId == row.FindingId
                    && candidate.MetadataKey == row.MetadataKey);

                if (metadataIndex >= 0)
                    StoredMetadata[metadataIndex] = row;
                else
                    StoredMetadata.Add(row);
            }

            if (observation is not null)
                StoredObservations.Add(observation);

            return Task.CompletedTask;
        }
    }
}
