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
///     Unit coverage for governance compliance drift trend HTTP wiring (scope + tenant preflight).
/// </summary>
[Trait("Category", "Unit")]
public sealed class GovernanceControllerComplianceDriftTrendTests
{
    [SkippableFact]
    public async Task GetComplianceDriftTrend_returns_not_found_when_tenant_missing()
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000011112222");
        DateTime fromUtc = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime toUtc = new(2026, 1, 8, 0, 0, 0, DateTimeKind.Utc);

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IComplianceDriftTrendService> driftTrend = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(scope.Object, driftTrend.Object, tenants.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetComplianceDriftTrend(fromUtc, toUtc, 1440, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        driftTrend.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task GetComplianceDriftTrend_returns_ok_when_tenant_exists()
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000011112222");
        DateTime fromUtc = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime toUtc = new(2026, 1, 8, 0, 0, 0, DateTimeKind.Utc);
        IReadOnlyList<ComplianceDriftTrendPoint> expected = [];

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = tenantId, Name = "contoso" });

        Mock<IComplianceDriftTrendService> driftTrend = new();
        driftTrend
            .Setup(s => s.GetTrendAsync(
                tenantId,
                fromUtc,
                toUtc,
                TimeSpan.FromMinutes(1440),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        GovernanceController sut = CreateController(scope.Object, driftTrend.Object, tenants.Object);

        IActionResult result = await sut.GetComplianceDriftTrend(fromUtc, toUtc, 1440, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(expected);
    }

    private static GovernanceController CreateController(
        IScopeContextProvider scope,
        IComplianceDriftTrendService driftTrend,
        ITenantRepository tenants) =>
        new(
            Mock.Of<IGovernanceWorkflowService>(),
            Mock.Of<IGovernanceApprovalRequestRepository>(),
            Mock.Of<IGovernancePromotionRecordRepository>(),
            Mock.Of<IGovernanceEnvironmentActivationRepository>(),
            Mock.Of<IActorContext>(),
            scope,
            Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
            Mock.Of<IGovernanceDashboardService>(),
            Mock.Of<IGovernanceLineageService>(),
            Mock.Of<IGovernanceRationaleService>(),
            driftTrend,
            Mock.Of<IPolicyPackDryRunService>(),
            Mock.Of<IPolicyPackGovernanceDryRunService>(),
            Mock.Of<IPolicyPackSchemaKeysService>(),
            Mock.Of<Core.Audit.IAuditService>(),
            Mock.Of<IPolicyPackDraftService>(),
            Mock.Of<IPolicyPackGeneratorService>(),
            tenants,
            NullLogger<GovernanceController>.Instance);
}
