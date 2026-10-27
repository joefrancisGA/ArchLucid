using ArchLucid.Application;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Models;

using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceDigestDecisionNeededComposerTests
{
    [Fact]
    public async Task BuildDecisionNeededMarkdownAsync_includes_unowned_high_severity_and_fyi_sections()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals.Setup(repo => repo.GetPendingAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);

        Mock<IArchitectureRiskRegisterService> riskRegister = new();
        riskRegister
            .Setup(service => service.GetRegisterAsync(tenantId, It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<int>(), It.IsAny<ArchitectureRiskRegisterListOptions?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ArchitectureRiskRegisterResponse
                {
                    Entries =
                    [
                        new ArchitectureRiskRegisterEntry
                        {
                            FindingId = "f-high",
                            Title = "Unowned ingress gap",
                            Severity = "High",
                            StatusLabel = "Open",
                            EvidenceHref = "/reviews/abc/findings/f-high",
                        },
                    ],
                });

        Mock<IRiskExceptionService> waivers = new();
        waivers
            .Setup(service => service.ListActiveAsync(tenantId, It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListSinceUtcAsync(tenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = tenantId,
                    WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                    ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                    FindingId = "f-remediated",
                    ReviewerUserId = "reviewer",
                    Action = FindingReviewAction.RecordDisposition,
                    Disposition = ArchLucid.Contracts.Findings.FindingDisposition.Remediated,
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                },
            ]);

        Mock<IArchitectureDigestRepository> digests = new();
        Mock<ISponsorRoiSummaryService> roi = new();

        GovernanceDigestDecisionNeededComposer composer = new(
            approvals.Object,
            riskRegister.Object,
            waivers.Object,
            trail.Object,
            digests.Object,
            roi.Object);

        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        string? markdown = await composer.BuildDecisionNeededMarkdownAsync(tenantId, workspaceId, null);

        markdown.Should().NotBeNull();
        markdown.Should().Contain("## Decision needed");
        markdown.Should().Contain("### Unowned high-severity risks");
        markdown.Should().Contain("## FYI");
        markdown.Should().Contain("marked remediated");
    }

    [Fact]
    public async Task BuildSummaryAsync_excludes_foreign_workspace_disposition_trail_events()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid foreignWorkspaceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals.Setup(repo => repo.GetPendingAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);

        Mock<IArchitectureRiskRegisterService> riskRegister = new();
        riskRegister
            .Setup(service => service.GetRegisterAsync(tenantId, workspaceId, projectId, It.IsAny<int>(), It.IsAny<ArchitectureRiskRegisterListOptions?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRiskRegisterResponse());

        Mock<IRiskExceptionService> waivers = new();
        waivers
            .Setup(service => service.ListActiveAsync(tenantId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListSinceUtcAsync(tenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    FindingId = "f-in-scope",
                    ReviewerUserId = "reviewer",
                    Action = FindingReviewAction.RecordDisposition,
                    Disposition = ArchLucid.Contracts.Findings.FindingDisposition.NeedsEvidence,
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                },
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = tenantId,
                    WorkspaceId = foreignWorkspaceId,
                    ProjectId = projectId,
                    FindingId = "f-foreign",
                    ReviewerUserId = "reviewer",
                    Action = FindingReviewAction.RecordDisposition,
                    Disposition = ArchLucid.Contracts.Findings.FindingDisposition.NeedsEvidence,
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                },
            ]);

        GovernanceDigestDecisionNeededComposer composer = new(
            approvals.Object,
            riskRegister.Object,
            waivers.Object,
            trail.Object,
            Mock.Of<IArchitectureDigestRepository>(),
            Mock.Of<ISponsorRoiSummaryService>());

        GovernanceDecisionsNeededSummaryResponse summary = await composer.BuildSummaryAsync(
            tenantId,
            workspaceId,
            projectId,
            CancellationToken.None);

        summary.FindingsAwaitingEvidence.Should().Be(1);
        summary.TotalDecisionItems.Should().Be(1);
    }

    [Fact]
    public async Task BuildSummaryAsync_excludes_foreign_workspace_active_waivers()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid foreignWorkspaceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        DateTimeOffset nowUtc = DateTimeOffset.UtcNow;

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals.Setup(repo => repo.GetPendingAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);

        Mock<IArchitectureRiskRegisterService> riskRegister = new();
        riskRegister
            .Setup(service => service.GetRegisterAsync(tenantId, workspaceId, projectId, It.IsAny<int>(), It.IsAny<ArchitectureRiskRegisterListOptions?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRiskRegisterResponse());

        Mock<IRiskExceptionService> waivers = new();
        waivers
            .Setup(service => service.ListActiveAsync(tenantId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RiskExceptionRecord
                {
                    RiskExceptionId = Guid.NewGuid(),
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    FindingId = "f-in-scope",
                    ExpiresAtUtc = nowUtc.AddDays(7),
                    Status = RiskExceptionStatus.Active,
                },
                new RiskExceptionRecord
                {
                    RiskExceptionId = Guid.NewGuid(),
                    TenantId = tenantId,
                    WorkspaceId = foreignWorkspaceId,
                    ProjectId = projectId,
                    FindingId = "f-foreign",
                    ExpiresAtUtc = nowUtc.AddDays(7),
                    Status = RiskExceptionStatus.Active,
                },
            ]);

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListSinceUtcAsync(tenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        GovernanceDigestDecisionNeededComposer composer = new(
            approvals.Object,
            riskRegister.Object,
            waivers.Object,
            trail.Object,
            Mock.Of<IArchitectureDigestRepository>(),
            Mock.Of<ISponsorRoiSummaryService>());

        GovernanceDecisionsNeededSummaryResponse summary = await composer.BuildSummaryAsync(
            tenantId,
            workspaceId,
            projectId,
            CancellationToken.None);

        summary.WaiversExpiringWithin14Days.Should().Be(1);
        summary.TotalDecisionItems.Should().Be(1);
    }

    [Fact]
    public async Task BuildSummaryAsync_ignores_review_events_superseded_by_a_later_disposition()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        DateTimeOffset nowUtc = DateTimeOffset.UtcNow;
        DateTimeOffset earlier = nowUtc.AddDays(-2);
        DateTimeOffset later = nowUtc.AddHours(-1);

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals.Setup(repo => repo.GetPendingAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);

        Mock<IArchitectureRiskRegisterService> riskRegister = new();
        riskRegister
            .Setup(service => service.GetRegisterAsync(tenantId, workspaceId, projectId, It.IsAny<int>(), It.IsAny<ArchitectureRiskRegisterListOptions?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRiskRegisterResponse());

        Mock<IRiskExceptionService> waivers = new();
        waivers
            .Setup(service => service.ListActiveAsync(tenantId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListSinceUtcAsync(tenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                ReviewEvent(tenantId, workspaceId, projectId, "f-still-deferred", ArchLucid.Contracts.Findings.FindingDisposition.Deferred, later, nowUtc.AddHours(-1)),
                ReviewEvent(tenantId, workspaceId, projectId, "f-closed-evidence", ArchLucid.Contracts.Findings.FindingDisposition.Remediated, later, null),
                ReviewEvent(tenantId, workspaceId, projectId, "f-closed-deferred", ArchLucid.Contracts.Findings.FindingDisposition.Remediated, later, null),
                ReviewEvent(tenantId, workspaceId, projectId, "f-closed-evidence", ArchLucid.Contracts.Findings.FindingDisposition.NeedsEvidence, earlier, null, "Show the diagram"),
                ReviewEvent(tenantId, workspaceId, projectId, "f-closed-deferred", ArchLucid.Contracts.Findings.FindingDisposition.Deferred, earlier, nowUtc.AddHours(-1)),
            ]);

        Mock<IArchitectureDigestRepository> digests = new();
        digests
            .Setup(repo => repo.ListByScopeAsync(tenantId, workspaceId, projectId, 2, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<ISponsorRoiSummaryService> roi = new();
        roi
            .Setup(service => service.BuildAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Contracts.Roi.SponsorRoiSummaryResponse());

        GovernanceDigestDecisionNeededComposer composer = new(
            approvals.Object,
            riskRegister.Object,
            waivers.Object,
            trail.Object,
            digests.Object,
            roi.Object);

        GovernanceDecisionsNeededSummaryResponse summary = await composer.BuildSummaryAsync(
            tenantId,
            workspaceId,
            projectId,
            CancellationToken.None);

        summary.FindingsAwaitingEvidence.Should().Be(0);
        summary.DeferredFindingsDue.Should().Be(1);
        summary.TotalDecisionItems.Should().Be(1);

        string? markdown = await composer.BuildDecisionNeededMarkdownAsync(tenantId, workspaceId, projectId);

        markdown.Should().Contain("f-still-deferred");
        markdown.Should().NotContain("f-closed-evidence");
        markdown.Should().NotContain("f-closed-deferred");
    }

    [Fact]
    public async Task BuildDecisionNeededMarkdownAsync_fyi_remediated_count_ignores_superseded_remediated_events()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        DateTimeOffset earlier = DateTimeOffset.UtcNow.AddDays(-3);
        DateTimeOffset later = DateTimeOffset.UtcNow.AddHours(-2);

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        approvals.Setup(repo => repo.GetPendingAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);

        Mock<IArchitectureRiskRegisterService> riskRegister = new();
        riskRegister
            .Setup(service => service.GetRegisterAsync(tenantId, workspaceId, projectId, It.IsAny<int>(), It.IsAny<ArchitectureRiskRegisterListOptions?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRiskRegisterResponse());

        Mock<IRiskExceptionService> waivers = new();
        waivers
            .Setup(service => service.ListActiveAsync(tenantId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListSinceUtcAsync(tenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                ReviewEvent(tenantId, workspaceId, projectId, "f-reopened", ArchLucid.Contracts.Findings.FindingDisposition.NeedsEvidence, later, null, "Need proof"),
                ReviewEvent(tenantId, workspaceId, projectId, "f-reopened", ArchLucid.Contracts.Findings.FindingDisposition.Remediated, earlier, null),
            ]);

        Mock<IArchitectureDigestRepository> digests = new();
        digests
            .Setup(repo => repo.ListByScopeAsync(tenantId, workspaceId, projectId, 2, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<ISponsorRoiSummaryService> roi = new();
        roi
            .Setup(service => service.BuildAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Contracts.Roi.SponsorRoiSummaryResponse());

        GovernanceDigestDecisionNeededComposer composer = new(
            approvals.Object,
            riskRegister.Object,
            waivers.Object,
            trail.Object,
            digests.Object,
            roi.Object);

        string? markdown = await composer.BuildDecisionNeededMarkdownAsync(tenantId, workspaceId, projectId);

        markdown.Should().NotBeNull();
        markdown.Should().Contain("Findings awaiting evidence");
        markdown.Should().NotContain("marked remediated in the last 30 days");
    }

    [Fact]
    public async Task EnsureOpenDispositionTrailRunsSealedForSummaryAsync_throws_when_needs_evidence_run_is_unsealed()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid unsealedRunId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId };

        Mock<IGovernanceApprovalRequestRepository> approvals = new();
        Mock<IArchitectureRiskRegisterService> riskRegister = new();
        Mock<IRiskExceptionService> waivers = new();
        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListSinceUtcAsync(tenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    FindingId = "finding-trail",
                    ReviewerUserId = "reviewer",
                    Action = FindingReviewAction.RecordDisposition,
                    Disposition = ArchLucid.Contracts.Findings.FindingDisposition.NeedsEvidence,
                    RunId = unsealedRunId,
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                },
            ]);

        GovernanceDigestDecisionNeededComposer composer = new(
            approvals.Object,
            riskRegister.Object,
            waivers.Object,
            trail.Object,
            Mock.Of<IArchitectureDigestRepository>(),
            Mock.Of<ISponsorRoiSummaryService>());

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(query => query.GetRunDetailForManifestCompareAsync(scope, unsealedRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new RunDetailDto
                {
                    Run = new RunRecord { RunId = unsealedRunId },
                    GoldenManifest = null,
                });

        Func<Task> act = async () => await composer.EnsureOpenDispositionTrailRunsSealedForSummaryAsync(
            tenantId,
            workspaceId,
            projectId,
            scope,
            authority.Object,
            SealedManifestHashTestSupport.CreateManifestHashService(),
            Mock.Of<IFindingInspectReadRepository>(),
            CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task EnsureOpenDispositionTrailRunsSealedForSummaryAsync_throws_when_trail_run_id_missing_and_inspect_is_absent()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId };
        const string findingId = "finding-trail-no-run";

        Mock<IFindingReviewTrailRepository> trail = new();
        trail
            .Setup(repo => repo.ListSinceUtcAsync(tenantId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new FindingReviewEventRecord
                {
                    EventId = Guid.NewGuid(),
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    FindingId = findingId,
                    ReviewerUserId = "reviewer",
                    Action = FindingReviewAction.RecordDisposition,
                    Disposition = ArchLucid.Contracts.Findings.FindingDisposition.NeedsEvidence,
                    RunId = null,
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                },
            ]);

        GovernanceDigestDecisionNeededComposer composer = new(
            Mock.Of<IGovernanceApprovalRequestRepository>(),
            Mock.Of<IArchitectureRiskRegisterService>(),
            Mock.Of<IRiskExceptionService>(),
            trail.Object,
            Mock.Of<IArchitectureDigestRepository>(),
            Mock.Of<ISponsorRoiSummaryService>());

        Mock<IFindingInspectReadRepository> inspect = new();
        inspect
            .Setup(repo => repo.GetInspectAsync(
                scope,
                findingId,
                It.IsAny<CancellationToken>(),
                FindingInspectReadOptions.MetadataOnly))
            .ReturnsAsync((FindingInspectResponse?)null);

        Func<Task> act = async () => await composer.EnsureOpenDispositionTrailRunsSealedForSummaryAsync(
            tenantId,
            workspaceId,
            projectId,
            scope,
            Mock.Of<IAuthorityQueryService>(),
            SealedManifestHashTestSupport.CreateManifestHashService(),
            inspect.Object,
            CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }

    private static FindingReviewEventRecord ReviewEvent(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string findingId,
        ArchLucid.Contracts.Findings.FindingDisposition disposition,
        DateTimeOffset occurredAtUtc,
        DateTimeOffset? revisitDueUtc,
        string? evidenceRequestText = null) =>
        new()
        {
            EventId = Guid.NewGuid(),
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            FindingId = findingId,
            ReviewerUserId = "reviewer",
            Action = FindingReviewAction.RecordDisposition,
            Disposition = disposition,
            OccurredAtUtc = occurredAtUtc,
            RevisitDueUtc = revisitDueUtc,
            EvidenceRequestText = evidenceRequestText,
        };
}
