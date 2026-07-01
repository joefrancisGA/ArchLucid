using System.Security.Claims;

using ArchLucid.Api.Controllers.Roi;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RoiControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public async Task GetExecutiveSummaryAsync_returns_service_payload()
    {
        ExecutiveRoiSummaryResponse summary = new() { TotalEstimatedUsdSavings = 12_500m };

        Mock<IExecutiveRoiSummaryService> roi = new();
        roi.Setup(s => s.BuildAsync(It.IsAny<CancellationToken>())).ReturnsAsync(summary);

        RoiController controller = CreateController(roi.Object, Mock.Of<IExecutiveRoiBoardPackExporter>());

        ActionResult<ExecutiveRoiSummaryResponse> action =
            await controller.GetExecutiveSummaryAsync(CancellationToken.None);

        OkObjectResult ok = action.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(summary);
    }

    [Fact]
    public async Task GetExecutiveSummaryBoardPackAsync_returns_bad_request_for_invalid_format()
    {
        RoiController controller = CreateController(
            Mock.Of<IExecutiveRoiSummaryService>(),
            Mock.Of<IExecutiveRoiBoardPackExporter>());

        IActionResult action = await controller.GetExecutiveSummaryBoardPackAsync(
            format: "docx",
            generateNarrative: false,
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task GetExecutiveSummaryBoardPackAsync_returns_markdown_and_audits()
    {
        ExecutiveRoiBoardPackExportResult export = new()
        {
            Format = ExecutiveRoiBoardPackFormat.Markdown,
            ContentType = "text/markdown; charset=utf-8",
            Markdown = "# ROI"
        };

        Mock<IExecutiveRoiBoardPackExporter> exporter = new();
        exporter
            .Setup(e => e.ExportAsync(
                ExecutiveRoiBoardPackFormat.Markdown,
                It.IsAny<string?>(),
                false,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(export);

        Mock<IAuditService> audit = new();

        RoiController controller = CreateController(
            Mock.Of<IExecutiveRoiSummaryService>(),
            exporter.Object,
            audit.Object);

        IActionResult action = await controller.GetExecutiveSummaryBoardPackAsync(
            format: "md",
            generateNarrative: false,
            CancellationToken.None);

        ContentResult content = action.Should().BeOfType<ContentResult>().Subject;
        content.Content.Should().Be("# ROI");

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.ExecutiveRoiBoardPackExported),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetCrossTenantPortfolioSummaryAsync_returns_forbidden_when_directory_key_missing()
    {
        RoiController controller = CreateController(
            Mock.Of<IExecutiveRoiSummaryService>(),
            Mock.Of<IExecutiveRoiBoardPackExporter>());

        ActionResult<CrossTenantPortfolioSummaryResponse> action =
            await controller.GetCrossTenantPortfolioSummaryAsync(CancellationToken.None);

        ObjectResult forbidden = action.Result.Should().BeOfType<ObjectResult>().Subject;
        forbidden.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
    }

    private static RoiController CreateController(
        IExecutiveRoiSummaryService executiveRoiSummaryService,
        IExecutiveRoiBoardPackExporter boardPackExporter,
        IAuditService? audit = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        DefaultHttpContext httpContext = new();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.Name, "operator@test")],
            authenticationType: "test"));

        return new RoiController(
                executiveRoiSummaryService,
                boardPackExporter,
                audit ?? Mock.Of<IAuditService>(),
                scopeProvider.Object)
            {
                ControllerContext = new ControllerContext { HttpContext = httpContext }
            };
    }
}
