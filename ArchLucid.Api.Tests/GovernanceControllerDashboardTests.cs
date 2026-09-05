using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.ProblemDetails;
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
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private static ScopeContext DashboardScope(Guid tenantId) =>
        new() { TenantId = tenantId, WorkspaceId = WorkspaceId };

    private static void SetupTenantExists(Mock<ITenantRepository> tenants, Guid tenantId, params Guid[] workspaceIds)
    {
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = tenantId, Name = "contoso" });
        tenants
            .Setup(t => t.ListWorkspacesAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(workspaceIds.Select(id => new TenantWorkspaceListItem
            {
                WorkspaceId = id,
                Name = "workspace",
            }).ToList());
    }

    [SkippableFact]
    public async Task GetDashboard_ReturnsOkWithSummary()
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000011112222");

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(DashboardScope(tenantId));

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
        SetupTenantExists(tenants, tenantId, WorkspaceId);

        GovernanceController sut = GovernanceControllerTestFactory.Create(
            scopeContextProvider: scope.Object,
            dashboardService: dashboard.Object,
            tenantRepository: tenants.Object);

        IActionResult result = await sut.GetDashboard(20, 20, 20, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        OkObjectResult ok = (OkObjectResult)result;
        ok.Value.Should().BeOfType<GovernanceDashboardSummary>();
        GovernanceDashboardSummary payload = (GovernanceDashboardSummary)ok.Value!;
        payload.PendingCount.Should().Be(1);
        payload.PendingApprovals.Should().ContainSingle().Which.ApprovalRequestId.Should().Be("x1");
    }

    [SkippableFact]
    public async Task GetDashboard_returns_ok_when_workspace_changes_despite_matching_summary_etag()
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000011112222");
        Guid workspaceA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        GovernanceDashboardSummary emptySummary = new()
        {
            PendingApprovals = [],
            RecentDecisions = [],
            RecentChanges = [],
            PendingCount = 0,
        };

        Mock<IGovernanceDashboardService> dashboard = new();
        dashboard
            .Setup(d => d.GetDashboardAsync(
                tenantId,
                20,
                20,
                20,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(emptySummary);

        Mock<ITenantRepository> tenants = new();
        SetupTenantExists(tenants, tenantId, workspaceA, workspaceB);

        Mock<IScopeContextProvider> scopeA = new();
        scopeA.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = tenantId,
            WorkspaceId = workspaceA,
        });

        GovernanceController controllerA = GovernanceControllerTestFactory.Create(
            scopeContextProvider: scopeA.Object,
            dashboardService: dashboard.Object,
            tenantRepository: tenants.Object);

        IActionResult first = await controllerA.GetDashboard(20, 20, 20, CancellationToken.None);
        first.Should().BeOfType<OkObjectResult>();
        string etag = controllerA.Response.Headers.ETag.ToString();
        etag.Should().NotBeNullOrWhiteSpace();

        Mock<IScopeContextProvider> scopeB = new();
        scopeB.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = tenantId,
            WorkspaceId = workspaceB,
        });

        DefaultHttpContext httpContext = new();
        httpContext.Request.Headers.IfNoneMatch = etag;

        GovernanceController controllerB = GovernanceControllerTestFactory.Create(
            scopeContextProvider: scopeB.Object,
            dashboardService: dashboard.Object,
            tenantRepository: tenants.Object,
            httpContext: httpContext);

        IActionResult second = await controllerB.GetDashboard(20, 20, 20, CancellationToken.None);

        second.Should().BeOfType<OkObjectResult>();
    }

    [SkippableFact]
    public async Task GetDashboard_returns_not_found_when_tenant_missing()
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000011112222");

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(DashboardScope(tenantId));

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IGovernanceDashboardService> dashboard = new(MockBehavior.Strict);

        GovernanceController sut = GovernanceControllerTestFactory.Create(
            scopeContextProvider: scope.Object,
            dashboardService: dashboard.Object,
            tenantRepository: tenants.Object);

        IActionResult result = await sut.GetDashboard(20, 20, 20, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        dashboard.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task GetDashboard_returns_not_found_when_workspace_missing()
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000011112222");
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = tenantId,
            WorkspaceId = foreignWorkspaceId,
        });

        Mock<ITenantRepository> tenants = new();
        SetupTenantExists(tenants, tenantId, WorkspaceId);

        Mock<IGovernanceDashboardService> dashboard = new(MockBehavior.Strict);

        GovernanceController sut = GovernanceControllerTestFactory.Create(
            scopeContextProvider: scope.Object,
            dashboardService: dashboard.Object,
            tenantRepository: tenants.Object);

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
        scope.Setup(s => s.GetCurrentScope()).Returns(DashboardScope(tenantId));

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = tenantId, Name = "contoso" });

        Mock<IGovernanceDashboardService> dashboard = new(MockBehavior.Strict);

        GovernanceController sut = GovernanceControllerTestFactory.Create(
            scopeContextProvider: scope.Object,
            dashboardService: dashboard.Object,
            tenantRepository: tenants.Object);

        IActionResult result = await sut.GetDashboard(maxPending: 0, maxDecisions: 20, maxChanges: 20, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dashboard.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task GetDashboard_returns_bad_request_when_max_pending_is_zero_and_tenant_missing()
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000011112222");

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(DashboardScope(tenantId));

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IGovernanceDashboardService> dashboard = new(MockBehavior.Strict);

        GovernanceController sut = GovernanceControllerTestFactory.Create(
            scopeContextProvider: scope.Object,
            dashboardService: dashboard.Object,
            tenantRepository: tenants.Object);

        IActionResult result = await sut.GetDashboard(maxPending: 0, maxDecisions: 20, maxChanges: 20, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dashboard.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task GetDashboard_returns_bad_request_when_max_decisions_exceeds_fifty()
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000011112222");

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(DashboardScope(tenantId));

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = tenantId, Name = "contoso" });

        Mock<IGovernanceDashboardService> dashboard = new(MockBehavior.Strict);

        GovernanceController sut = GovernanceControllerTestFactory.Create(
            scopeContextProvider: scope.Object,
            dashboardService: dashboard.Object,
            tenantRepository: tenants.Object);

        IActionResult result = await sut.GetDashboard(maxPending: 20, maxDecisions: 51, maxChanges: 20, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dashboard.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task GetDashboard_returns_bad_request_when_max_changes_exceeds_fifty()
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000011112222");

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(DashboardScope(tenantId));

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = tenantId, Name = "contoso" });

        Mock<IGovernanceDashboardService> dashboard = new(MockBehavior.Strict);

        GovernanceController sut = GovernanceControllerTestFactory.Create(
            scopeContextProvider: scope.Object,
            dashboardService: dashboard.Object,
            tenantRepository: tenants.Object);

        IActionResult result = await sut.GetDashboard(maxPending: 20, maxDecisions: 20, maxChanges: 51, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dashboard.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task GetDashboard_returns_bad_request_when_max_pending_exceeds_fifty()
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000011112222");

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(DashboardScope(tenantId));

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = tenantId, Name = "contoso" });

        Mock<IGovernanceDashboardService> dashboard = new(MockBehavior.Strict);

        GovernanceController sut = GovernanceControllerTestFactory.Create(
            scopeContextProvider: scope.Object,
            dashboardService: dashboard.Object,
            tenantRepository: tenants.Object);

        IActionResult result = await sut.GetDashboard(maxPending: 51, maxDecisions: 20, maxChanges: 20, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
        dashboard.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task GetComplianceDriftTrend_returns_bad_request_when_bucket_count_exceeds_five_hundred()
    {
        DateTime fromUtc = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime toUtc = fromUtc.AddDays(22);

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.NewGuid() });

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        Mock<IComplianceDriftTrendService> drift = new(MockBehavior.Strict);

        GovernanceController sut = GovernanceControllerTestFactory.Create(
            scopeContextProvider: scope.Object,
            complianceDriftTrendService: drift.Object,
            tenantRepository: tenants.Object);

        IActionResult result = await sut.GetComplianceDriftTrend(fromUtc, toUtc, 60, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        tenants.VerifyNoOtherCalls();
        drift.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task GetComplianceDriftTrend_returns_not_found_when_tenant_missing()
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000011112222");
        DateTime fromUtc = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime toUtc = fromUtc.AddDays(7);

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(DashboardScope(tenantId));

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        Mock<IComplianceDriftTrendService> drift = new(MockBehavior.Strict);

        GovernanceController sut = GovernanceControllerTestFactory.Create(
            scopeContextProvider: scope.Object,
            complianceDriftTrendService: drift.Object,
            tenantRepository: tenants.Object);

        IActionResult result = await sut.GetComplianceDriftTrend(fromUtc, toUtc, 1440, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        drift.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task GetComplianceDriftTrend_returns_validation_failed_when_fromUtc_is_not_before_toUtc()
    {
        DateTime fromUtc = new(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime toUtc = fromUtc;

        GovernanceController sut = CreateControllerForDriftTrend(drift: new Mock<IComplianceDriftTrendService>(MockBehavior.Strict));

        IActionResult result = await sut.GetComplianceDriftTrend(fromUtc, toUtc, 1440, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
    }

    [SkippableFact]
    public async Task GetComplianceDriftTrend_returns_validation_failed_when_bucket_minutes_out_of_range()
    {
        DateTime fromUtc = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime toUtc = fromUtc.AddDays(7);

        GovernanceController sut = CreateControllerForDriftTrend(drift: new Mock<IComplianceDriftTrendService>(MockBehavior.Strict));

        IActionResult result = await sut.GetComplianceDriftTrend(fromUtc, toUtc, 30, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
    }

    [SkippableFact]
    public async Task GetComplianceDriftTrend_returns_ok_when_bucket_count_is_exactly_five_hundred()
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000011112222");
        DateTime fromUtc = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime toUtc = fromUtc.AddHours(500);
        const int bucketMinutes = 60;

        Mock<IComplianceDriftTrendService> drift = new();
        drift
            .Setup(d => d.GetTrendAsync(
                tenantId,
                fromUtc,
                toUtc,
                TimeSpan.FromMinutes(bucketMinutes),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        GovernanceController sut = CreateControllerForDriftTrend(drift);

        IActionResult result = await sut.GetComplianceDriftTrend(fromUtc, toUtc, bucketMinutes, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        drift.VerifyAll();
    }

    [SkippableFact]
    public async Task GetComplianceDriftTrend_returns_bad_request_when_bucket_count_is_five_hundred_and_one()
    {
        DateTime fromUtc = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime toUtc = fromUtc.AddHours(501);
        const int bucketMinutes = 60;

        GovernanceController sut = CreateControllerForDriftTrend(drift: new Mock<IComplianceDriftTrendService>(MockBehavior.Strict));

        IActionResult result = await sut.GetComplianceDriftTrend(fromUtc, toUtc, bucketMinutes, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    private static GovernanceController CreateControllerForDriftTrend(Mock<IComplianceDriftTrendService> drift)
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-000011112222");

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = tenantId, Name = "contoso" });

        return GovernanceControllerTestFactory.Create(
            scopeContextProvider: scope.Object,
            complianceDriftTrendService: drift.Object,
            tenantRepository: tenants.Object);
    }
}
