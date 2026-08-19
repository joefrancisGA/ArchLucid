using System.Security.Claims;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Verifies durable <see cref="IAuditService.LogAsync" /> wiring on controllers that previously lacked coverage.
/// </summary>
[Trait("Category", "Unit")]
public sealed class AnalysisReportsControllerAuditTests
{
    [SkippableFact]
    public async Task AnalyzeRun_AfterSuccessfulBuild_LogsArchitectureAnalysisReportGeneratedWithDataJson()
    {
        string runId = Guid.NewGuid().ToString("N");
        ArchitectureRunDetail detail = new() { Run = new ArchitectureRun { RunId = runId } };

        ArchitectureAnalysisReport report = new()
        {
            Manifest = new GoldenManifest { Metadata = new ManifestMetadata { ManifestVersion = "v7" } },
            Warnings = ["a"]
        };

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery
            .Setup(r => r.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IArchitectureAnalysisService> analysis = new();
        analysis
            .Setup(a => a.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(report);

        Mock<IAuditService> audit = new();

        AnalysisReportsController sut = new(
            runDetailQuery.Object,
            analysis.Object,
            Mock.Of<IArchitectureAnalysisExportService>(),
            Mock.Of<IArchitectureAnalysisDocxExportService>(),
            Mock.Of<IArchitectureAnalysisConsultingDocxExportService>(),
            Mock.Of<IConsultingDocxTemplateRecommendationService>(),
            Mock.Of<IConsultingDocxExportProfileSelector>(),
            Mock.Of<IRunExportAuditService>(),
            Mock.Of<IRunExportRecordRepository>(),
            Mock.Of<IBackgroundJobQueue>(),
            audit.Object,
            NullLogger<AnalysisReportsController>.Instance) { ControllerContext = CreateControllerContext() };

        IActionResult response = await sut.AnalyzeRun(runId, new ArchitectureAnalysisRequest(), CancellationToken.None);

        response.Should().BeOfType<OkObjectResult>();
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.ArchitectureAnalysisReportGenerated
                    && !string.IsNullOrWhiteSpace(e.DataJson)
                    && e.DataJson.Contains("\"manifestVersion\":\"v7\"", StringComparison.Ordinal)
                    && e.DataJson.Contains("\"warningCount\":1", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    internal static ControllerContext CreateControllerContext()
    {
        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "test-user")]))
        };

        return new ControllerContext { HttpContext = http };
    }
}
