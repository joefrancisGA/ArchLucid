using ArchLucid.Application.Roi;
using ArchLucid.Core.Configuration;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Roi;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
public sealed class TenantAdjustedFindingsSavingsCalculatorEaMultiplierTests
{
    private static readonly ValueReportComputationOptions Defaults = new()
    {
        FullyLoadedArchitectHourlyUsd = 150m,
        DefaultAverageIncidentCostUsd = 25_000m,
    };

    [Fact]
    public void ComputeTotal_applies_ea_discount_multiplier_to_cost_findings()
    {
        FindingsSnapshot snapshot = new()
        {
            TotalEstimatedSavings = 100m,
            Findings =
            [
                new Finding
                {
                    Category = "Cost",
                    HumanReviewStatus = FindingHumanReviewStatus.Approved,
                    ProjectedImpactUsd = 100m,
                },
            ],
        };

        TenantCostSettingsRecord settings = new()
        {
            TenantId = Guid.NewGuid(),
            ArchitectHourlyRateUsd = 150m,
            AverageIncidentCostUsd = 25_000m,
            EaDiscountMultiplier = 0.5m,
            UpdatedUtc = DateTimeOffset.UtcNow,
        };

        decimal total = TenantAdjustedFindingsSavingsCalculator.ComputeTotal(snapshot, settings, Defaults);

        total.Should().Be(50m);
    }
}
