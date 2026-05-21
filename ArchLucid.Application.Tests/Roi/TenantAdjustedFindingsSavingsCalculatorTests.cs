using ArchLucid.Application.Roi;
using ArchLucid.Core.Configuration;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Roi;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
public sealed class TenantAdjustedFindingsSavingsCalculatorTests
{
    private static readonly ValueReportComputationOptions Defaults = new()
    {
        FullyLoadedArchitectHourlyUsd = 150m,
        DefaultAverageIncidentCostUsd = 25_000m,
    };

    [Fact]
    public void ComputeTotal_without_tenant_row_returns_persisted_snapshot_total()
    {
        FindingsSnapshot snapshot = new()
        {
            TotalEstimatedSavings = 999m,
            Findings = [],
        };

        decimal total = TenantAdjustedFindingsSavingsCalculator.ComputeTotal(snapshot, null, Defaults);

        total.Should().Be(999m);
    }

    [Fact]
    public void ComputeTotal_scales_cost_findings_by_hourly_rate_ratio()
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
            ArchitectHourlyRateUsd = 300m,
            AverageIncidentCostUsd = 25_000m,
            UpdatedUtc = DateTimeOffset.UtcNow,
        };

        decimal total = TenantAdjustedFindingsSavingsCalculator.ComputeTotal(snapshot, settings, Defaults);

        total.Should().Be(200m);
    }

    [Fact]
    public void ComputeTotal_scales_non_cost_findings_by_incident_cost_ratio()
    {
        FindingsSnapshot snapshot = new()
        {
            TotalEstimatedSavings = 50m,
            Findings =
            [
                new Finding
                {
                    Category = "Reliability",
                    HumanReviewStatus = FindingHumanReviewStatus.Approved,
                    ProjectedImpactUsd = 25_000m,
                },
            ],
        };

        TenantCostSettingsRecord settings = new()
        {
            TenantId = Guid.NewGuid(),
            ArchitectHourlyRateUsd = 150m,
            AverageIncidentCostUsd = 50_000m,
            UpdatedUtc = DateTimeOffset.UtcNow,
        };

        decimal total = TenantAdjustedFindingsSavingsCalculator.ComputeTotal(snapshot, settings, Defaults);

        total.Should().Be(50_000m);
    }
}
