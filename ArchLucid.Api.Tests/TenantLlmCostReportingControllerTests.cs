using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Application.Billing;
using ArchLucid.Contracts.Billing;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantLlmCostReportingControllerTests
{
    [Fact]
    public async Task GetDashboard_returns_service_dashboard()
    {
        LlmCostReportingDashboardResponse dashboard = new()
        {
            Currency = "USD",
            CostBasisLabel = "estimated",
            Daily =
            [
                new LlmCostDailyBucketResponse
                {
                    BucketUtc = DateTimeOffset.Parse("2026-06-01T00:00:00Z"),
                    EstimatedCostUsd = 4.5m,
                    PromptTokens = 1000,
                    CompletionTokens = 500
                }
            ]
        };

        Mock<ITenantLlmCostReportingService> reporting = new();
        reporting
            .Setup(s => s.BuildDashboardAsync(14, It.IsAny<CancellationToken>()))
            .ReturnsAsync(dashboard);

        TenantLlmCostReportingController controller = new(reporting.Object);

        ActionResult<LlmCostReportingDashboardResponse> action =
            await controller.GetDashboard(days: 14, CancellationToken.None);

        OkObjectResult ok = action.Result.Should().BeOfType<OkObjectResult>().Subject;
        LlmCostReportingDashboardResponse body =
            ok.Value.Should().BeOfType<LlmCostReportingDashboardResponse>().Subject;

        body.Daily.Should().ContainSingle();
        body.Daily[0].EstimatedCostUsd.Should().Be(4.5m);

        reporting.Verify(
            s => s.BuildDashboardAsync(14, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
