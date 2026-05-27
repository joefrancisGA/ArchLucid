using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Configuration;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Roi;

public sealed class DispositionAwareRoiBasisCalculatorTests
{
    private static readonly ValueReportComputationOptions Defaults = new()
    {
        FullyLoadedArchitectHourlyUsd = 200m,
        DefaultAverageIncidentCostUsd = 50_000m,
    };

    [Fact]
    public void Compute_partitions_waived_and_remediated_without_inflating_potential()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                CreateCostFinding("f-open", 1000m, FindingHumanReviewStatus.Approved),
                CreateCostFinding("f-waived", 2000m, FindingHumanReviewStatus.Approved),
                CreateCostFinding("f-remediated", 3000m, FindingHumanReviewStatus.Approved),
            ],
        };

        IReadOnlyList<FindingReviewEventRecord> events =
        [
            new FindingReviewEventRecord
            {
                EventId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                FindingId = "f-remediated",
                ReviewerUserId = "reviewer",
                Action = FindingReviewAction.RecordDisposition,
                OccurredAtUtc = DateTimeOffset.UtcNow,
                Disposition = FindingDisposition.Remediated,
            },
        ];

        IReadOnlyList<RiskExceptionRecord> waivers =
        [
            new RiskExceptionRecord
            {
                RiskExceptionId = Guid.NewGuid(),
                FindingId = "f-waived",
                OwnerUserId = "owner",
                Rationale = "time bound",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
                Status = RiskExceptionStatus.Active,
            },
        ];

        ExecutiveRoiBasisBreakdown breakdown = DispositionAwareRoiBasisCalculator.Compute(
            [snapshot],
            events,
            waivers,
            tenantSettings: null,
            Defaults);

        breakdown.OpenEstimatedUsd.Should().Be(1000m);
        breakdown.WaivedUsd.Should().Be(2000m);
        breakdown.RealizedUsd.Should().Be(3000m);
        breakdown.TotalPotentialUsd.Should().Be(3000m);
    }

    private static Finding CreateCostFinding(string findingId, decimal impact, FindingHumanReviewStatus reviewStatus) =>
        new()
        {
            FindingId = findingId,
            Category = "Cost",
            EngineType = "TestEngine",
            HumanReviewStatus = reviewStatus,
            ProjectedImpactUsd = impact,
        };
}
