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

    [Fact]
    public async Task IngestBatchAsync_same_natural_key_in_different_project_creates_distinct_finding()
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        OperationalSecurityFindingIngestService sut = new(
            repository,
            Mock.Of<IAuditService>(),
            NullLogger<OperationalSecurityFindingIngestService>.Instance);

        ScopeContext firstScope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };
        ScopeContext secondScope = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        };

        OperationalSecurityFindingIngestItem item = CreateItem("scanner-shared", "finding-shared");

        OperationalSecurityFindingBatchIngestResult first =
            await sut.IngestBatchAsync(firstScope, [item], "actor@test");
        OperationalSecurityFindingBatchIngestResult second =
            await sut.IngestBatchAsync(secondScope, [item], "actor@test");

        first.IngestedCount.Should().Be(1);
        second.IngestedCount.Should().Be(1);
        second.DeduplicatedCount.Should().Be(0);
        repository.StoredFindings.Should().HaveCount(2);
        repository.StoredFindings.Select(row => row.ProjectId).Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public async Task TryGetDetailAsync_foreign_project_returns_not_found()
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        OperationalSecurityFindingIngestService sut = new(
            repository,
            Mock.Of<IAuditService>(),
            NullLogger<OperationalSecurityFindingIngestService>.Instance);

        ScopeContext sourceScope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };
        OperationalSecurityFindingBatchIngestResult ingest =
            await sut.IngestBatchAsync(sourceScope, [CreateItem("scanner-project", "finding-project")], "actor@test");

        ScopeContext foreignProject = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
        };

        OperationalSecurityFindingDetailResult detail =
            await sut.TryGetDetailAsync(foreignProject, ingest.Items[0].FindingId!.Value);

        detail.Succeeded.Should().BeFalse();
        detail.Finding.Should().BeNull();
    }

    [Fact]
    public async Task IngestBatchAsync_stale_changed_payload_does_not_reopen_or_replace_evidence()
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        OperationalSecurityFindingIngestService sut = new(
            repository,
            Mock.Of<IAuditService>(),
            NullLogger<OperationalSecurityFindingIngestService>.Instance);

        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };
        DateTime latest = new(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc);
        OperationalSecurityFindingIngestItem closed = CreateObservation(latest, OperationalSecurityFindingStatus.Closed, "fixed");
        OperationalSecurityFindingIngestItem delayed = CreateObservation(latest.AddDays(-1), OperationalSecurityFindingStatus.Open, "old");

        await sut.IngestBatchAsync(scope, [closed], "actor@test");
        OperationalSecurityFindingBatchIngestResult result = await sut.IngestBatchAsync(scope, [delayed], "actor@test");

        result.FailedCount.Should().Be(1);
        result.Items[0].WasDeduplicated.Should().BeFalse();
        result.Items[0].ErrorMessage.Should().Be("Observation is older than the current operational finding.");
        OperationalSecurityFindingRecord stored = repository.StoredFindings.Should().ContainSingle().Which;
        stored.Status.Should().Be(OperationalSecurityFindingStatus.Closed);
        stored.LastObservedUtc.Should().Be(latest);
        stored.UpdatedUtc.Should().Be(latest);
        stored.RawEvidenceReference.Should().Be("fixed");
        repository.StoredMetadata.Should().ContainSingle().Which.MetadataValue.Should().Be("fixed");
        repository.StoredObservations.Should().ContainSingle();
    }

    [Fact]
    public async Task IngestBatchAsync_stale_identical_payload_deduplicates_without_moving_watermark()
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        OperationalSecurityFindingIngestService sut = new(
            repository,
            Mock.Of<IAuditService>(),
            NullLogger<OperationalSecurityFindingIngestService>.Instance);

        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };
        DateTime latest = new(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc);

        OperationalSecurityFindingBatchIngestResult initial = await sut.IngestBatchAsync(
            scope, [CreateObservation(latest, OperationalSecurityFindingStatus.Open, "same")], "actor@test");
        OperationalSecurityFindingBatchIngestResult replay = await sut.IngestBatchAsync(
            scope, [CreateObservation(latest.AddDays(-1), OperationalSecurityFindingStatus.Open, "same")], "actor@test");

        replay.DeduplicatedCount.Should().Be(1);
        replay.Items[0].FindingId.Should().Be(initial.Items[0].FindingId);
        OperationalSecurityFindingRecord stored = repository.StoredFindings.Should().ContainSingle().Which;
        stored.LastObservedUtc.Should().Be(latest);
        stored.UpdatedUtc.Should().Be(latest);
        repository.StoredObservations.Should().ContainSingle();
    }

    [Fact]
    public async Task IngestBatchAsync_newer_open_observation_still_records_recurrence()
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        OperationalSecurityFindingIngestService sut = new(
            repository,
            Mock.Of<IAuditService>(),
            NullLogger<OperationalSecurityFindingIngestService>.Instance);

        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };
        DateTime closed = new(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc);
        DateTime recurred = closed.AddDays(1);

        await sut.IngestBatchAsync(
            scope, [CreateObservation(closed, OperationalSecurityFindingStatus.Closed, "fixed")], "actor@test");
        OperationalSecurityFindingBatchIngestResult result = await sut.IngestBatchAsync(
            scope, [CreateObservation(recurred, OperationalSecurityFindingStatus.Open, "regression")], "actor@test");

        result.IngestedCount.Should().Be(1);
        OperationalSecurityFindingRecord stored = repository.StoredFindings.Should().ContainSingle().Which;
        stored.Status.Should().Be(OperationalSecurityFindingStatus.Recurred);
        stored.LastObservedUtc.Should().Be(recurred);
        stored.RawEvidenceReference.Should().Be("regression");
        repository.StoredObservations.Should().HaveCount(2);
    }

    private static OperationalSecurityFindingIngestItem CreateObservation(
        DateTime observedUtc,
        OperationalSecurityFindingStatus status,
        string evidence) =>
        new()
        {
            Provider = CloudProvider.Azure,
            SourceSystem = "scanner",
            SourceFindingId = "finding-chronology",
            Title = "Runtime vulnerability",
            ObservedUtc = observedUtc,
            Status = status,
            RawEvidenceReference = evidence,
            Metadata = new Dictionary<string, string?> { ["proof"] = evidence },
        };

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

        public Task<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(
            Guid tenantId,
            Guid cloudResourceId,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)>(([], 0));

        public Task<IReadOnlyList<Guid>> ListFindingIdsByPathIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Guid>>([]);

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
