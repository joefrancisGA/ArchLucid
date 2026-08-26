using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Application.Billing;
using ArchLucid.Contracts.Billing;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantLlmCostReportingControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public async Task GetDashboard_returns_not_found_when_tenant_missing()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        TenantLlmCostReportingController controller = CreateController(
            Mock.Of<ITenantLlmCostReportingService>(),
            scopeProvider.Object,
            tenants.Object);

        IActionResult action = await controller.GetDashboard(days: 30, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetDashboard_returns_bad_request_when_days_out_of_range()
    {
        TenantLlmCostReportingController controller = CreateController(
            Mock.Of<ITenantLlmCostReportingService>(),
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<ITenantRepository>());

        IActionResult action = await controller.GetDashboard(days: 0, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

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

        TenantLlmCostReportingController controller = CreateController(reporting.Object);

        IActionResult action = await controller.GetDashboard(days: 14, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        LlmCostReportingDashboardResponse body =
            ok.Value.Should().BeOfType<LlmCostReportingDashboardResponse>().Subject;

        body.Daily.Should().ContainSingle();
        body.Daily[0].EstimatedCostUsd.Should().Be(4.5m);

        reporting.Verify(
            s => s.BuildDashboardAsync(14, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static TenantLlmCostReportingController CreateController(
        ITenantLlmCostReportingService reportingService,
        IScopeContextProvider? scopeProvider = null,
        ITenantRepository? tenantRepository = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });

        return new TenantLlmCostReportingController(
            reportingService,
            scopeProvider ?? scope.Object,
            tenantRepository ?? tenants.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }
}
