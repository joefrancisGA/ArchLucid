using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Unit coverage for governance dashboard HTTP wiring (scope + dashboard service).
/// </summary>
[Trait("Category", "Unit")]
public sealed class GovernanceControllerDashboardTests
{
    [SkippableFact]
    public async Task GetDashboard_ReturnsOkWithSummary()
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000011112222");

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        GovernanceDashboardSummary expected = new()
        {
            PendingApprovals = [new GovernanceApprovalRequest { ApprovalRequestId = "x1" }],
            RecentDecisions = [],
            RecentChanges = [],
            PendingCount = 1
        };

        Mock<IGovernanceDashboardService> dashboard = new();
        dashboard
            .Setup(d => d.GetDashboardAsync(
                tenantId,
                20,
                20,
                20,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = tenantId, Name = "contoso" });

        GovernanceController sut = new(
            Mock.Of<IGovernanceWorkflowService>(),
            Mock.Of<IGovernanceApprovalRequestRepository>(),
            Mock.Of<IGovernancePromotionRecordRepository>(),
            Mock.Of<IGovernanceEnvironmentActivationRepository>(),
            Mock.Of<IActorContext>(),
            scope.Object,
            Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
            dashboard.Object,
            Mock.Of<IGovernanceLineageService>(),
            Mock.Of<IGovernanceRationaleService>(),
            Mock.Of<IComplianceDriftTrendService>(),
            Mock.Of<IPolicyPackDryRunService>(),
            Mock.Of<IPolicyPackGovernanceDryRunService>(),
            Mock.Of<IPolicyPackSchemaKeysService>(),
            Mock.Of<Core.Audit.IAuditService>(),
            Mock.Of<IPolicyPackDraftService>(),
            Mock.Of<IPolicyPackGeneratorService>(),
            tenants.Object,
            NullLogger<GovernanceController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await sut.GetDashboard(20, 20, 20, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        OkObjectResult ok = (OkObjectResult)result;
        ok.Value.Should().BeOfType<GovernanceDashboardSummary>();
        GovernanceDashboardSummary payload = (GovernanceDashboardSummary)ok.Value!;
        payload.PendingCount.Should().Be(1);
        payload.PendingApprovals.Should().ContainSingle().Which.ApprovalRequestId.Should().Be("x1");
    }

    [SkippableFact]
    public async Task GetDashboard_returns_not_found_when_tenant_missing()
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000011112222");

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IGovernanceDashboardService> dashboard = new(MockBehavior.Strict);

        GovernanceController sut = new(
            Mock.Of<IGovernanceWorkflowService>(),
            Mock.Of<IGovernanceApprovalRequestRepository>(),
            Mock.Of<IGovernancePromotionRecordRepository>(),
            Mock.Of<IGovernanceEnvironmentActivationRepository>(),
            Mock.Of<IActorContext>(),
            scope.Object,
            Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
            dashboard.Object,
            Mock.Of<IGovernanceLineageService>(),
            Mock.Of<IGovernanceRationaleService>(),
            Mock.Of<IComplianceDriftTrendService>(),
            Mock.Of<IPolicyPackDryRunService>(),
            Mock.Of<IPolicyPackGovernanceDryRunService>(),
            Mock.Of<IPolicyPackSchemaKeysService>(),
            Mock.Of<Core.Audit.IAuditService>(),
            Mock.Of<IPolicyPackDraftService>(),
            Mock.Of<IPolicyPackGeneratorService>(),
            tenants.Object,
            NullLogger<GovernanceController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await sut.GetDashboard(20, 20, 20, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        dashboard.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task GetDashboard_returns_bad_request_when_max_pending_is_zero()
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000011112222");

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = tenantId, Name = "contoso" });

        Mock<IGovernanceDashboardService> dashboard = new(MockBehavior.Strict);

        GovernanceController sut = new(
            Mock.Of<IGovernanceWorkflowService>(),
            Mock.Of<IGovernanceApprovalRequestRepository>(),
            Mock.Of<IGovernancePromotionRecordRepository>(),
            Mock.Of<IGovernanceEnvironmentActivationRepository>(),
            Mock.Of<IActorContext>(),
            scope.Object,
            Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
            dashboard.Object,
            Mock.Of<IGovernanceLineageService>(),
            Mock.Of<IGovernanceRationaleService>(),
            Mock.Of<IComplianceDriftTrendService>(),
            Mock.Of<IPolicyPackDryRunService>(),
            Mock.Of<IPolicyPackGovernanceDryRunService>(),
            Mock.Of<IPolicyPackSchemaKeysService>(),
            Mock.Of<Core.Audit.IAuditService>(),
            Mock.Of<IPolicyPackDraftService>(),
            Mock.Of<IPolicyPackGeneratorService>(),
            tenants.Object,
            NullLogger<GovernanceController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await sut.GetDashboard(maxPending: 0, maxDecisions: 20, maxChanges: 20, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dashboard.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task GetComplianceDriftTrend_returns_not_found_when_tenant_missing()
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000011112222");
        DateTime fromUtc = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime toUtc = fromUtc.AddDays(7);

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IComplianceDriftTrendService> drift = new(MockBehavior.Strict);

        GovernanceController sut = new(
            Mock.Of<IGovernanceWorkflowService>(),
            Mock.Of<IGovernanceApprovalRequestRepository>(),
            Mock.Of<IGovernancePromotionRecordRepository>(),
            Mock.Of<IGovernanceEnvironmentActivationRepository>(),
            Mock.Of<IActorContext>(),
            scope.Object,
            Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
            Mock.Of<IGovernanceDashboardService>(),
            Mock.Of<IGovernanceLineageService>(),
            Mock.Of<IGovernanceRationaleService>(),
            drift.Object,
            Mock.Of<IPolicyPackDryRunService>(),
            Mock.Of<IPolicyPackGovernanceDryRunService>(),
            Mock.Of<IPolicyPackSchemaKeysService>(),
            Mock.Of<Core.Audit.IAuditService>(),
            Mock.Of<IPolicyPackDraftService>(),
            Mock.Of<IPolicyPackGeneratorService>(),
            tenants.Object,
            NullLogger<GovernanceController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult result = await sut.GetComplianceDriftTrend(fromUtc, toUtc, 1440, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        drift.VerifyNoOtherCalls();
    }
}
