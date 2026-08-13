using System.Security.Claims;
using System.Text.Json;

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
    public async Task GetSponsorReportAsync_returns_service_payload()
    {
        SponsorRoiSummaryResponse summary = new() { TotalEstimatedUsdSavings = 12_500m };

        Mock<ISponsorRoiSummaryService> roi = new();
        roi.Setup(s => s.BuildAsync(It.IsAny<CancellationToken>())).ReturnsAsync(summary);

        RoiController controller = CreateController(roi.Object, Mock.Of<ISponsorRoiBoardPackExporter>());

        IActionResult action =
            await controller.GetSponsorReportAsync(CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(summary);
    }

    [Fact]
    public async Task GetSponsorReportBoardPackAsync_returns_bad_request_for_invalid_format()
    {
        RoiController controller = CreateController(
            Mock.Of<ISponsorRoiSummaryService>(),
            Mock.Of<ISponsorRoiBoardPackExporter>());

        IActionResult action = await controller.GetSponsorReportBoardPackAsync(
            format: "docx",
            generateNarrative: false,
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task GetSponsorReportBoardPackAsync_returns_markdown_and_audits()
    {
        SponsorRoiBoardPackExportResult export = new()
        {
            Format = SponsorRoiBoardPackFormat.Markdown,
            ContentType = "text/markdown; charset=utf-8",
            Markdown = "# ROI"
        };

        Mock<ISponsorRoiBoardPackExporter> exporter = new();
        exporter
            .Setup(e => e.ExportAsync(
                SponsorRoiBoardPackFormat.Markdown,
                It.IsAny<string?>(),
                false,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(export);

        Mock<IAuditService> audit = new();

        RoiController controller = CreateController(
            Mock.Of<ISponsorRoiSummaryService>(),
            exporter.Object,
            audit.Object);

        IActionResult action = await controller.GetSponsorReportBoardPackAsync(
            format: "md",
            generateNarrative: false,
            CancellationToken.None);

        ContentResult content = action.Should().BeOfType<ContentResult>().Subject;
        content.Content.Should().Be("# ROI");

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.SponsorRoiBoardPackExported
                    && !string.IsNullOrWhiteSpace(e.DataJson)),
                It.IsAny<CancellationToken>()),
            Times.Once);

        JsonDocument auditJson = JsonDocument.Parse(
            audit.Invocations[0].Arguments[0] is AuditEvent ev ? ev.DataJson : "{}");
        auditJson.RootElement.GetProperty("format").GetString().Should().Be("markdown");
    }

    [Fact]
    public async Task GetSponsorReportBoardPackAsync_returns_pdf_and_audits_with_json_payload()
    {
        SponsorRoiBoardPackExportResult export = new()
        {
            Format = SponsorRoiBoardPackFormat.Pdf,
            ContentType = "application/pdf",
            FileName = "sponsor-roi-board-pack.pdf",
            FileBytes = [0x25, 0x50, 0x44, 0x46],
        };

        Mock<ISponsorRoiBoardPackExporter> exporter = new();
        exporter
            .Setup(e => e.ExportAsync(
                SponsorRoiBoardPackFormat.Pdf,
                It.IsAny<string?>(),
                false,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(export);

        Mock<IAuditService> audit = new();

        RoiController controller = CreateController(
            Mock.Of<ISponsorRoiSummaryService>(),
            exporter.Object,
            audit.Object);

        IActionResult action = await controller.GetSponsorReportBoardPackAsync(
            format: "pdf",
            generateNarrative: false,
            CancellationToken.None);

        FileContentResult file = action.Should().BeOfType<FileContentResult>().Subject;
        file.ContentType.Should().Be("application/pdf");

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.SponsorRoiBoardPackExported
                    && !string.IsNullOrWhiteSpace(e.DataJson)),
                It.IsAny<CancellationToken>()),
            Times.Once);

        JsonDocument auditJson = JsonDocument.Parse(
            audit.Invocations[0].Arguments[0] is AuditEvent ev ? ev.DataJson : "{}");
        auditJson.RootElement.GetProperty("format").GetString().Should().Be("pdf");
    }

    [Fact]
    public async Task GetCrossTenantPortfolioSummaryAsync_returns_forbidden_when_directory_key_missing()
    {
        RoiController controller = CreateController(
            Mock.Of<ISponsorRoiSummaryService>(),
            Mock.Of<ISponsorRoiBoardPackExporter>());

        ActionResult<CrossTenantPortfolioSummaryResponse> action =
            await controller.GetCrossTenantPortfolioSummaryAsync(CancellationToken.None);

        ObjectResult forbidden = action.Result.Should().BeOfType<ObjectResult>().Subject;
        forbidden.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
    }

    private static RoiController CreateController(
        ISponsorRoiSummaryService SponsorRoiSummaryService,
        ISponsorRoiBoardPackExporter boardPackExporter,
        IAuditService? audit = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        DefaultHttpContext httpContext = new();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.Name, "operator@test")],
            authenticationType: "test"));

        return new RoiController(
                SponsorRoiSummaryService,
                boardPackExporter,
                audit ?? Mock.Of<IAuditService>(),
                scopeProvider.Object)
            {
                ControllerContext = new ControllerContext { HttpContext = httpContext }
            };
    }
}
