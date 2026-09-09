using ArchLucid.Application.Findings;
using ArchLucid.Application.Findings.FindingVerification;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

/// <summary>TB-2033 / DX-19 / TB-2034: append-only finding verification reports linked to sealed packages.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingVerificationServiceTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly ScopeContext ForeignScope = new()
    {
        TenantId = Guid.Parse("77777777-7777-7777-7777-777777777777"),
        WorkspaceId = TestScope.WorkspaceId,
        ProjectId = TestScope.ProjectId,
    };

    private static readonly Guid RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private const string SealedManifestHash = "sha256-sealed-manifest-hash-demo";

    [Fact]
    public async Task CreateReportAsync_sealed_run_writes_report_and_preserves_source_manifest_hash()
    {
        Guid findingsSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Finding finding = new()
        {
            FindingId = "finding-verification-1",
            Title = "Public storage exposure",
            Severity = FindingSeverity.Critical,
        };

        RunDetailDto detail = BuildSealedRunDetail(findingsSnapshotId, finding);

        Mock<IAuthorityQueryService> authorityQuery = new();
        authorityQuery
            .Setup(service => service.GetRunDetailAsync(TestScope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        InMemoryFindingVerificationReportRepository repository = new();
        List<AuditEvent> auditEvents = [];

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => auditEvents.Add(auditEvent))
            .Returns(Task.CompletedTask);

        FindingVerificationService sut = CreateService(authorityQuery.Object, repository, auditService.Object);

        FindingVerificationCreateReportResult result = await sut.CreateReportAsync(
            TestScope,
            RunId,
            new CreateFindingVerificationReportRequest(),
            "operator@test",
            CancellationToken.None);

        result.CreatedNewReport.Should().BeTrue();
        result.Response.ReportId.Should().NotBe(Guid.Empty);
        result.Response.SourceManifestHash.Should().Be(SealedManifestHash);
        result.Response.Results.Should().ContainSingle();
        result.Response.Results[0].Status.Should().Be(FindingVerificationStatus.NotVerifiable);

        FindingVerificationReportRecord? stored =
            await repository.GetByIdAsync(TestScope, result.Response.ReportId, CancellationToken.None);

        stored.Should().NotBeNull();
        stored!.SourceManifestHash.Should().Be(SealedManifestHash);

        auditEvents.Should().Contain(e => e.EventType == AuditEventTypes.FindingVerificationStarted);
        auditEvents.Should().Contain(e => e.EventType == AuditEventTypes.FindingVerificationCompleted);
    }

    [Fact]
    public async Task CreateReportAsync_with_correlated_verification_snapshot_marks_materialized()
    {
        Guid sourceSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Guid verificationSnapshotId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        Finding sourceFinding = new()
        {
            FindingId = "finding-verification-1",
            Title = "Public storage exposure",
            Category = "Storage",
            EngineType = "Topology",
            Severity = FindingSeverity.Critical,
            PolicyRuleId = "rule-storage-public",
            EvidenceRefs = ["arm:/subscriptions/demo/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/demo"],
        };

        Finding verificationFinding = new()
        {
            FindingId = "finding-verification-1-later",
            Title = "Public storage exposure",
            Category = "Storage",
            EngineType = "Topology",
            Severity = FindingSeverity.Critical,
            PolicyRuleId = "rule-storage-public",
            EvidenceRefs = ["arm:/subscriptions/demo/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/demo"],
        };

        RunDetailDto detail = BuildSealedRunDetail(sourceSnapshotId, sourceFinding);
        FindingsSnapshot verificationSnapshot = new()
        {
            FindingsSnapshotId = verificationSnapshotId,
            Findings = [verificationFinding],
        };

        Mock<IAuthorityQueryService> authorityQuery = new();
        authorityQuery
            .Setup(service => service.GetRunDetailAsync(TestScope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IFindingsSnapshotRepository> findingsSnapshotRepository = new();
        findingsSnapshotRepository
            .Setup(repository => repository.GetByIdAsync(TestScope, verificationSnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(verificationSnapshot);

        Mock<IFindingReviewTrailRepository> reviewTrailRepository = new();
        reviewTrailRepository
            .Setup(repository => repository.ListForFindingIdsSinceUtcAsync(
                TestScope.TenantId,
                It.IsAny<IReadOnlyCollection<string>>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        FindingVerificationService sut = CreateService(
            authorityQuery.Object,
            new InMemoryFindingVerificationReportRepository(),
            Mock.Of<IAuditService>(),
            findingsSnapshotRepository.Object,
            reviewTrailRepository.Object);

        FindingVerificationCreateReportResult result = await sut.CreateReportAsync(
            TestScope,
            RunId,
            new CreateFindingVerificationReportRequest { VerificationFindingsSnapshotId = verificationSnapshotId },
            "operator@test",
            CancellationToken.None);

        result.Response.Results.Should().ContainSingle();
        result.Response.Results[0].Status.Should().Be(FindingVerificationStatus.Materialized);
        result.Response.Results[0].TraceText.Should().Contain("RV-003");
    }

    [Fact]
    public async Task CreateReportAsync_same_package_pair_is_idempotent()
    {
        Guid findingsSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Finding finding = new()
        {
            FindingId = "finding-verification-1",
            Title = "Public storage exposure",
            Severity = FindingSeverity.Critical,
        };

        RunDetailDto detail = BuildSealedRunDetail(findingsSnapshotId, finding);

        Mock<IAuthorityQueryService> authorityQuery = new();
        authorityQuery
            .Setup(service => service.GetRunDetailAsync(TestScope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        InMemoryFindingVerificationReportRepository repository = new();
        FindingVerificationService sut = CreateService(authorityQuery.Object, repository);

        CreateFindingVerificationReportRequest request = new();
        FindingVerificationCreateReportResult first = await sut.CreateReportAsync(
            TestScope,
            RunId,
            request,
            "operator@test",
            CancellationToken.None);

        FindingVerificationCreateReportResult second = await sut.CreateReportAsync(
            TestScope,
            RunId,
            request,
            "operator@test",
            CancellationToken.None);

        first.CreatedNewReport.Should().BeTrue();
        second.CreatedNewReport.Should().BeFalse();
        second.Response.ReportId.Should().Be(first.Response.ReportId);
        second.Response.ReportHash.Should().Be(first.Response.ReportHash);
    }

    [Fact]
    public async Task CreateReportAsync_new_report_enqueues_integration_event_outbox()
    {
        Guid findingsSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Finding finding = new()
        {
            FindingId = "finding-verification-1",
            Title = "Public storage exposure",
            Severity = FindingSeverity.Critical,
        };

        RunDetailDto detail = BuildSealedRunDetail(findingsSnapshotId, finding);

        Mock<IAuthorityQueryService> authorityQuery = new();
        authorityQuery
            .Setup(service => service.GetRunDetailAsync(TestScope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        InMemoryFindingVerificationReportRepository repository = new();
        InMemoryIntegrationEventOutboxRepository outbox = new();
        FindingVerificationService sut = CreateService(authorityQuery.Object, repository, outbox: outbox);

        long pendingBefore = await outbox.CountIntegrationOutboxPublishPendingAsync(CancellationToken.None);

        FindingVerificationCreateReportResult result = await sut.CreateReportAsync(
            TestScope,
            RunId,
            new CreateFindingVerificationReportRequest(),
            "operator@test",
            CancellationToken.None);

        result.CreatedNewReport.Should().BeTrue();

        long pendingAfter = await outbox.CountIntegrationOutboxPublishPendingAsync(CancellationToken.None);
        pendingAfter.Should().Be(pendingBefore + 1);

        IReadOnlyList<IntegrationEventOutboxEntry> batch =
            await outbox.DequeuePendingAsync(10, CancellationToken.None);

        batch.Should().ContainSingle(entry =>
            entry.EventType == IntegrationEventTypes.FindingVerificationCompletedV1
            && entry.RunId == RunId);
    }

    [Fact]
    public async Task CreateReportAsync_idempotent_replay_does_not_enqueue_integration_event_outbox()
    {
        Guid findingsSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        RunDetailDto detail = BuildSealedRunDetail(
            findingsSnapshotId,
            new Finding { FindingId = "finding-1", Title = "t", Severity = FindingSeverity.Error });

        Mock<IAuthorityQueryService> authorityQuery = new();
        authorityQuery
            .Setup(service => service.GetRunDetailAsync(TestScope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        InMemoryFindingVerificationReportRepository repository = new();
        InMemoryIntegrationEventOutboxRepository outbox = new();
        FindingVerificationService sut = CreateService(authorityQuery.Object, repository, outbox: outbox);

        await sut.CreateReportAsync(
            TestScope,
            RunId,
            new CreateFindingVerificationReportRequest(),
            "operator@test",
            CancellationToken.None);

        long pendingAfterFirst = await outbox.CountIntegrationOutboxPublishPendingAsync(CancellationToken.None);

        await sut.CreateReportAsync(
            TestScope,
            RunId,
            new CreateFindingVerificationReportRequest(),
            "operator@test",
            CancellationToken.None);

        long pendingAfterSecond = await outbox.CountIntegrationOutboxPublishPendingAsync(CancellationToken.None);
        pendingAfterSecond.Should().Be(pendingAfterFirst);
    }

    [Fact]
    public async Task CreateReportAsync_when_run_missing_throws_not_found()
    {
        Mock<IAuthorityQueryService> authorityQuery = new();
        authorityQuery
            .Setup(service => service.GetRunDetailAsync(TestScope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        FindingVerificationService sut = CreateService(authorityQuery.Object);

        Func<Task> act = () => sut.CreateReportAsync(
            TestScope,
            RunId,
            new CreateFindingVerificationReportRequest(),
            "operator@test",
            CancellationToken.None);

        await act.Should().ThrowAsync<FindingVerificationRunNotFoundException>();
    }

    [Fact]
    public async Task CreateReportAsync_when_manifest_unsealed_throws_not_sealed()
    {
        RunDetailDto detail = new()
        {
            Run = new RunRecord { RunId = RunId },
            FindingsSnapshot = new FindingsSnapshot
            {
                FindingsSnapshotId = Guid.NewGuid(),
                Findings = [new Finding { FindingId = "finding-1", Title = "t", Severity = FindingSeverity.Warning }],
            },
            GoldenManifest = new ManifestDocument { ManifestHash = string.Empty },
        };

        Mock<IAuthorityQueryService> authorityQuery = new();
        authorityQuery
            .Setup(service => service.GetRunDetailAsync(TestScope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        FindingVerificationService sut = CreateService(authorityQuery.Object);

        Func<Task> act = () => sut.CreateReportAsync(
            TestScope,
            RunId,
            new CreateFindingVerificationReportRequest(),
            "operator@test",
            CancellationToken.None);

        await act.Should().ThrowAsync<FindingVerificationRunNotSealedException>();
    }

    [Fact]
    public async Task GetByIdAsync_cross_tenant_scope_returns_null()
    {
        Guid findingsSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        RunDetailDto detail = BuildSealedRunDetail(
            findingsSnapshotId,
            new Finding { FindingId = "finding-1", Title = "t", Severity = FindingSeverity.Error });

        Mock<IAuthorityQueryService> authorityQuery = new();
        authorityQuery
            .Setup(service => service.GetRunDetailAsync(TestScope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        InMemoryFindingVerificationReportRepository repository = new();
        FindingVerificationService sut = CreateService(authorityQuery.Object, repository);

        FindingVerificationCreateReportResult result = await sut.CreateReportAsync(
            TestScope,
            RunId,
            new CreateFindingVerificationReportRequest(),
            "operator@test",
            CancellationToken.None);

        FindingVerificationReportRecord? foreignLookup =
            await repository.GetByIdAsync(ForeignScope, result.Response.ReportId, CancellationToken.None);

        foreignLookup.Should().BeNull();
    }

    private static FindingVerificationService CreateService(
        IAuthorityQueryService authorityQueryService,
        IAppendOnlyFindingVerificationReportRepository? repository = null,
        IAuditService? auditService = null,
        IFindingsSnapshotRepository? findingsSnapshotRepository = null,
        IFindingReviewTrailRepository? findingReviewTrailRepository = null,
        InMemoryIntegrationEventOutboxRepository? outbox = null)
    {
        InMemoryIntegrationEventOutboxRepository integrationEventOutbox = outbox ?? new InMemoryIntegrationEventOutboxRepository();
        Mock<IOptionsMonitor<IntegrationEventsOptions>> integrationEventsOptions = new();
        integrationEventsOptions
            .Setup(options => options.CurrentValue)
            .Returns(new IntegrationEventsOptions { TransactionalOutboxEnabled = true });

        return new FindingVerificationService(
            authorityQueryService,
            findingsSnapshotRepository ?? Mock.Of<IFindingsSnapshotRepository>(),
            repository ?? new InMemoryFindingVerificationReportRepository(),
            new CrossReviewFindingCorrelationService(),
            findingReviewTrailRepository ?? Mock.Of<IFindingReviewTrailRepository>(),
            new FindingVerificationDeterministicScorer(),
            auditService ?? Mock.Of<IAuditService>(),
            integrationEventOutbox,
            Mock.Of<IIntegrationEventPublisher>(),
            integrationEventsOptions.Object,
            Mock.Of<ILogger<FindingVerificationService>>());
    }

    private static RunDetailDto BuildSealedRunDetail(Guid findingsSnapshotId, Finding finding) =>
        new()
        {
            Run = new RunRecord { RunId = RunId },
            FindingsSnapshot = new FindingsSnapshot
            {
                FindingsSnapshotId = findingsSnapshotId,
                Findings = [finding],
            },
            GoldenManifest = new ManifestDocument { ManifestHash = SealedManifestHash },
        };
}
