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
            .Setup(service => service.GetRegisterAsync(tenantId, It.IsAny<Guid?>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
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
        Mock<IExecutiveRoiSummaryService> roi = new();

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
}
