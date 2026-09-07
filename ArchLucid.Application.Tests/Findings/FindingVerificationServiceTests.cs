using ArchLucid.Application.Findings.FindingVerification;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

/// <summary>TB-2033 / DX-19: append-only finding verification reports linked to sealed packages.</summary>
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

        FindingVerificationService sut = new(
            authorityQuery.Object,
            Mock.Of<IFindingsSnapshotRepository>(),
            repository,
            auditService.Object);

        FindingVerificationReportResponse response = await sut.CreateReportAsync(
            TestScope,
            RunId,
            new CreateFindingVerificationReportRequest(),
            "operator@test",
            CancellationToken.None);

        response.ReportId.Should().NotBe(Guid.Empty);
        response.SourceManifestHash.Should().Be(SealedManifestHash);
        response.Results.Should().ContainSingle();
        response.Results[0].Status.Should().Be(FindingVerificationStatus.NotVerifiable);

        FindingVerificationReportRecord? stored =
            await repository.GetByIdAsync(TestScope, response.ReportId, CancellationToken.None);

        stored.Should().NotBeNull();
        stored!.SourceManifestHash.Should().Be(SealedManifestHash);

        auditEvents.Should().Contain(e => e.EventType == AuditEventTypes.FindingVerificationStarted);
        auditEvents.Should().Contain(e => e.EventType == AuditEventTypes.FindingVerificationCompleted);
    }

    [Fact]
    public async Task CreateReportAsync_when_run_missing_throws_not_found()
    {
        Mock<IAuthorityQueryService> authorityQuery = new();
        authorityQuery
            .Setup(service => service.GetRunDetailAsync(TestScope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        FindingVerificationService sut = new(
            authorityQuery.Object,
            Mock.Of<IFindingsSnapshotRepository>(),
            new InMemoryFindingVerificationReportRepository(),
            Mock.Of<IAuditService>());

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

        FindingVerificationService sut = new(
            authorityQuery.Object,
            Mock.Of<IFindingsSnapshotRepository>(),
            new InMemoryFindingVerificationReportRepository(),
            Mock.Of<IAuditService>());

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
        FindingVerificationService sut = new(
            authorityQuery.Object,
            Mock.Of<IFindingsSnapshotRepository>(),
            repository,
            Mock.Of<IAuditService>());

        FindingVerificationReportResponse response = await sut.CreateReportAsync(
            TestScope,
            RunId,
            new CreateFindingVerificationReportRequest(),
            "operator@test",
            CancellationToken.None);

        FindingVerificationReportRecord? foreignLookup =
            await repository.GetByIdAsync(ForeignScope, response.ReportId, CancellationToken.None);

        foreignLookup.Should().BeNull();
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
