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
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly IPilotValueReportMarkdownFormatter MarkdownFormatter =
        new PilotValueReportMarkdownFormatter(new ExportFormatterService());

    private static TenantPilotValueReportController CreateController(
        IPilotValueReportService service,
        IScopeContextProvider? scopeProvider = null,
        ITenantRepository? tenantRepository = null,
        HttpContext? httpContext = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    TenantId = Scope.TenantId,
                    Name = "workspace",
                    DefaultProjectId = Scope.ProjectId,
                    CreatedUtc = TimeProvider.System.GetUtcNow(),
                }
            ]);

        return new TenantPilotValueReportController(
            service,
            MarkdownFormatter,
            scopeProvider ?? scope.Object,
            tenantRepository ?? tenants.Object,
            Mock.Of<IAuditRepository>())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = httpContext ?? new DefaultHttpContext(),
            },
        };
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
    public async Task GetPilotValueReport_returns_not_found_when_workspace_is_out_of_scope()
    {
        Guid foreignWorkspaceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPilotValueReportService> svc = new(MockBehavior.Strict);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = foreignWorkspaceId,
                    TenantId = Scope.TenantId,
                    Name = "foreign",
                    DefaultProjectId = Guid.NewGuid(),
                    CreatedUtc = TimeProvider.System.GetUtcNow(),
                }
            ]);

        TenantPilotValueReportController sut = CreateController(svc.Object, tenantRepository: tenants.Object);

        IActionResult result = await sut.GetPilotValueReport(null, null, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        svc.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task GetRoiSummaryPageBundle_returns_not_found_when_workspace_is_out_of_scope()
    {
        Guid foreignWorkspaceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPilotValueReportService> svc = new(MockBehavior.Strict);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = foreignWorkspaceId,
                    TenantId = Scope.TenantId,
                    Name = "foreign",
                    DefaultProjectId = Guid.NewGuid(),
                    CreatedUtc = TimeProvider.System.GetUtcNow(),
                }
            ]);

        TenantPilotValueReportController sut = CreateController(svc.Object, tenantRepository: tenants.Object);

        IActionResult result = await sut.GetRoiSummaryPageBundle(rollingDays: 30, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        svc.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task GetPilotValueReport_returns_problem_details_when_tenant_missing()
    {
        Mock<IPilotValueReportService> svc = new(MockBehavior.Strict);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        TenantPilotValueReportController sut = CreateController(svc.Object, tenantRepository: tenants.Object);

        IActionResult result = await sut.GetPilotValueReport(null, null, CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        Microsoft.AspNetCore.Mvc.ProblemDetails? pd = problem.Value as Microsoft.AspNetCore.Mvc.ProblemDetails;
        pd.Should().NotBeNull();
        pd.Detail.Should().Be("Tenant was not found for the current scope.");
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
}
