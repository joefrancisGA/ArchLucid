using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Reporting;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Audit;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantPilotValueReportControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    private static readonly IPilotValueReportMarkdownFormatter MarkdownFormatter =
        new PilotValueReportMarkdownFormatter(new ExportFormatterService());

    [Fact]
    public async Task GetPilotValueReport_returns_not_found_when_workspace_missing()
    {
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Scope.TenantId,
            WorkspaceId = foreignWorkspaceId,
            ProjectId = Scope.ProjectId,
        });

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(r => r.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        Mock<IPilotValueReportService> svc = new(MockBehavior.Strict);

        TenantPilotValueReportController sut = CreateController(
            svc.Object,
            scopeProvider: scopeProvider.Object,
            tenantRepository: tenants.Object);

        IActionResult result = await sut.GetPilotValueReport(null, null, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        svc.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetRoiSummaryPageBundle_returns_not_found_when_workspace_missing()
    {
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Scope.TenantId,
            WorkspaceId = foreignWorkspaceId,
            ProjectId = Scope.ProjectId,
        });

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(r => r.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        Mock<IPilotValueReportService> svc = new(MockBehavior.Strict);
        Mock<IAuditRepository> audit = new(MockBehavior.Strict);

        TenantPilotValueReportController sut = CreateController(
            svc.Object,
            scopeProvider: scopeProvider.Object,
            auditRepository: audit.Object,
            tenantRepository: tenants.Object);

        IActionResult result = await sut.GetRoiSummaryPageBundle(rollingDays: 30, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        svc.VerifyNoOtherCalls();
        audit.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task GetPilotValueReport_returns_bad_request_when_from_utc_before_1970()
    {
        Mock<IPilotValueReportService> svc = new(MockBehavior.Strict);

        TenantPilotValueReportController sut = CreateController(svc.Object);

        DateTime fromUtc = new(1, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime toUtc = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        IActionResult result = await sut.GetPilotValueReport(fromUtc, toUtc, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        svc.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task GetPilotValueReport_returns_json_by_default()
    {
        Mock<IPilotValueReportService> svc = new();
        PilotValueReport body = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = TimeProvider.System.UtcNowDateTime().AddDays(-7),
            ToUtc = TimeProvider.System.UtcNowDateTime(),
            TotalRunsCommitted = 2,
            GovernancePendingApprovalsNow = 0
        };

        svc.Setup(s => s.BuildAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(body);

        TenantPilotValueReportController sut = CreateController(svc.Object);

        IActionResult result = await sut.GetPilotValueReport(null, null, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(body);
    }

    [SkippableFact]
    public async Task GetPilotValueReport_returns_problem_details_when_tenant_missing()
    {
        Mock<IPilotValueReportService> svc = new(MockBehavior.Strict);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        TenantPilotValueReportController sut = CreateController(
            svc.Object,
            tenantRepository: tenants.Object);

        IActionResult result = await sut.GetPilotValueReport(null, null, CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        Microsoft.AspNetCore.Mvc.ProblemDetails? pd = problem.Value as Microsoft.AspNetCore.Mvc.ProblemDetails;
        pd.Should().NotBeNull();
        pd.Detail.Should().Be("Tenant not found.");
        svc.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task GetPilotValueReport_returns_markdown_when_accept_contains_text_markdown()
    {
        Mock<IPilotValueReportService> svc = new();
        DateTime fromUtc = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime toUtc = new(2026, 4, 30, 0, 0, 0, DateTimeKind.Utc);
        PilotValueReport body = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = fromUtc,
            ToUtc = toUtc,
            TotalRunsCommitted = 1,
            TotalFindings = 3,
            FindingsBySeverity = new PilotValueReportSeverityBreakdown { Critical = 1, High = 1, Medium = 1 },
            UniqueAgentTypes = ["Topology"],
            CommittedRunsTimeline =
            [
                new PilotValueReportRunTimelinePoint
                {
                    RunId = "run", CreatedUtc = fromUtc, CommittedUtc = fromUtc.AddHours(1), SystemName = "sys"
                }
            ]
        };

        svc.Setup(s => s.BuildAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(body);

        DefaultHttpContext http = new();
        http.Request.Headers.Accept = "text/markdown";

        TenantPilotValueReportController sut = CreateController(svc.Object, httpContext: http);

        IActionResult result = await sut.GetPilotValueReport(null, null, CancellationToken.None);

        ContentResult content = result.Should().BeOfType<ContentResult>().Subject;
        content.ContentType.Should().Contain("text/markdown");
        content.Content.Should().Contain("# ArchLucid pilot value report");
        content.Content.Should().Contain("| Critical | 1 |");
        content.Content.Should().Contain("| Committed runs | 1 |");
    }

    [SkippableFact]
    public async Task GetPilotValueReport_returns_json_when_json_has_higher_accept_quality_than_markdown()
    {
        Mock<IPilotValueReportService> svc = new();
        PilotValueReport body = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            FromUtc = TimeProvider.System.UtcNowDateTime().AddDays(-7),
            ToUtc = TimeProvider.System.UtcNowDateTime(),
            TotalRunsCommitted = 2,
            GovernancePendingApprovalsNow = 0,
        };

        svc.Setup(s => s.BuildAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(body);

        DefaultHttpContext http = new();
        http.Request.Headers.Accept = "application/json, text/markdown;q=0.1";

        TenantPilotValueReportController sut = CreateController(svc.Object, httpContext: http);

        IActionResult result = await sut.GetPilotValueReport(null, null, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(body);
    }

    private static TenantPilotValueReportController CreateController(
        IPilotValueReportService service,
        HttpContext? httpContext = null,
        IScopeContextProvider? scopeProvider = null,
        IAuditRepository? auditRepository = null,
        ITenantRepository? tenantRepository = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(r => r.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        return new TenantPilotValueReportController(
            service,
            MarkdownFormatter,
            scopeProvider ?? scope.Object,
            auditRepository ?? Mock.Of<IAuditRepository>(),
            tenantRepository ?? tenants.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = httpContext ?? new DefaultHttpContext(),
            },
        };
    }
}
