using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Suite", "Core")]
public sealed class FindingsSnapshotEstimatedSavingsCalculatorTests
{
    [Fact]
    public void ComputeTotal_SumsOnlyAcceptedCostFindingsWithProjectedImpact()
    {
        List<Finding> findings =
        [
            new()
            {
                Category = "Cost",
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ProjectedImpactUsd = 100m
            },
            new()
            {
                Category = "Cost",
                HumanReviewStatus = FindingHumanReviewStatus.NotRequired,
                ProjectedImpactUsd = 50m
            },
            new()
            {
                Category = "Cost",
                HumanReviewStatus = FindingHumanReviewStatus.Pending,
                ProjectedImpactUsd = 200m
            },
            new()
            {
                Category = "Security",
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ProjectedImpactUsd = 75m
            },
            new()
            {
                Category = "Cost",
                HumanReviewStatus = FindingHumanReviewStatus.Approved,
                ProjectedImpactUsd = null
            }
        ];

        decimal total = FindingsSnapshotEstimatedSavingsCalculator.ComputeTotal(findings);

        total.Should().Be(150m);
    }
}
