using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Application.Billing;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantMeasuredRoiControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public async Task GetAsync_maps_service_summary_to_response()
    {
        WhyArchLucidSnapshotResponse snapshot = new()
        {
            GeneratedUtc = DateTimeOffset.Parse("2026-06-01T12:00:00Z"),
            DemoRunId = "run-1",
            RunsCreatedTotal = 3,
            AuditRowCount = 12
        };

        TenantCostEstimate costBand = new(
            "USD",
            TenantTier.Standard,
            100m,
            200m,
            ["runs", "seats"],
            "estimated");

        TenantMeasuredRoiSummary summary = new(snapshot, costBand, "Planning only.");

        Mock<ITenantMeasuredRoiService> measuredRoi = new();
        measuredRoi
            .Setup(s => s.GetAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(summary);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantMeasuredRoiController controller = new(measuredRoi.Object, scopeProvider.Object);

        ActionResult<TenantMeasuredRoiResponse> action =
            await controller.GetAsync(CancellationToken.None);

        OkObjectResult ok = action.Result.Should().BeOfType<OkObjectResult>().Subject;
        TenantMeasuredRoiResponse body = ok.Value.Should().BeOfType<TenantMeasuredRoiResponse>().Subject;

        body.Snapshot.RunsCreatedTotal.Should().Be(3);
        body.MonthlyCostEstimate.Should().NotBeNull();
        body.MonthlyCostEstimate!.EstimatedMonthlyUsdLow.Should().Be(100m);
        body.Disclaimer.Should().Be("Planning only.");
    }

    [Fact]
    public async Task GetAsync_omits_monthly_cost_when_service_returns_null_band()
    {
        WhyArchLucidSnapshotResponse snapshot = new() { DemoRunId = "run-2" };
        TenantMeasuredRoiSummary summary = new(snapshot, null, "No cost band.");

        Mock<ITenantMeasuredRoiService> measuredRoi = new();
        measuredRoi
            .Setup(s => s.GetAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(summary);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        TenantMeasuredRoiController controller = new(measuredRoi.Object, scopeProvider.Object);

        ActionResult<TenantMeasuredRoiResponse> action =
            await controller.GetAsync(CancellationToken.None);

        OkObjectResult ok = action.Result.Should().BeOfType<OkObjectResult>().Subject;
        TenantMeasuredRoiResponse body = ok.Value.Should().BeOfType<TenantMeasuredRoiResponse>().Subject;

        body.MonthlyCostEstimate.Should().BeNull();
    }
}
