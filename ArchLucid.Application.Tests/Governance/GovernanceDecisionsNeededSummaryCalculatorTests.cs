using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceDecisionsNeededSummaryCalculatorTests
{
    private static readonly DateTimeOffset Now = new(2026, 5, 31, 12, 0, 0, TimeSpan.Zero);
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    [Fact]
    public void ComputeTotalDecisionItems_counts_finding_once_when_in_multiple_buckets()
    {
        ArchitectureRiskRegisterResponse register = new()
        {
            Entries =
            [
                new ArchitectureRiskRegisterEntry
                {
                    FindingId = "f-1",
                    Title = "Stale unowned",
                    Severity = "High",
                    IsStale = true,
                },
            ],
        };

        IReadOnlyList<FindingReviewEventRecord> recent =
        [
            TrailEvent("f-1", FindingDisposition.NeedsEvidence),
        ];

        int total = GovernanceDecisionsNeededSummaryCalculator.ComputeTotalDecisionItems(
            pendingApprovals: 0,
            register,
            recent,
            activeWaivers: [],
            Now);

        total.Should().Be(1);
    }

    [Fact]
    public void ComputeTotalDecisionItems_adds_pending_approvals_separately()
    {
        int total = GovernanceDecisionsNeededSummaryCalculator.ComputeTotalDecisionItems(
            pendingApprovals: 2,
            new ArchitectureRiskRegisterResponse(),
            [],
            [],
            Now);

        total.Should().Be(2);
    }

    private static FindingReviewEventRecord TrailEvent(string findingId, FindingDisposition disposition) =>
        new()
        {
            EventId = Guid.NewGuid(),
            TenantId = TenantId,
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            FindingId = findingId,
            ReviewerUserId = "reviewer",
            Action = FindingReviewAction.RecordDisposition,
            Disposition = disposition,
            OccurredAtUtc = Now,
        };
}
