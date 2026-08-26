using ArchLucid.Application.Governance;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Data.Repositories;

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
            .Setup(service => service.GetRegisterAsync(tenantId, It.IsAny<Guid?>(), It.IsAny<int>(), It.IsAny<ArchitectureRiskRegisterListOptions?>(), It.IsAny<CancellationToken>()))
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
            .Setup(service => service.GetRegisterAsync(tenantId, projectId, It.IsAny<int>(), It.IsAny<ArchitectureRiskRegisterListOptions?>(), It.IsAny<CancellationToken>()))
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
}
