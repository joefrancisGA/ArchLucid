using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Exports;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.CareerArtifacts;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunsExportControllerTests
{
    [Fact]
    public async Task Export_returns_not_found_for_whitespace_run_id_like_GetRun()
    {
        Mock<IArchitectureReviewExportService> exportService = new();
        Mock<IAuditService> auditService = new();
        Mock<IScopeContextProvider> scopeProvider = new();

        RunsExportController controller = new(
            exportService.Object,
            auditService.Object,
            scopeProvider.Object,
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult action = await controller.Export("   ", "docx", CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        exportService.Verify(
            s => s.GenerateReportAsync(
                It.IsAny<string>(),
                It.IsAny<ExportFormat>(),
                It.IsAny<WhitelabelConfiguration?>(),
                It.IsAny<byte[]?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Export_returns_409_when_career_export_blocked()
    {
        const string runId = "abc123def4567890abc123def4567890";

        Mock<IArchitectureReviewExportService> exportService = new();
        exportService
            .Setup(s => s.GenerateReportAsync(
                runId,
                ExportFormat.Docx,
                It.IsAny<WhitelabelConfiguration?>(),
                It.IsAny<byte[]?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new CareerArtifactExportBlockedException(
                SimulatorCareerHonestyPresenter.SimulatorRehearsalBlockedMessage,
                CareerArtifactCompletenessValidator.SimulatorRehearsalCode));

        IAuthorityQueryService authorityQuery =
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun();
        IManifestHashService manifestHashService =
            SealedManifestHashTestSupport.CreateManifestHashService();

        RunsExportController controller = new(
            exportService.Object,
            Mock.Of<IAuditService>(),
            Mock.Of<IScopeContextProvider>(),
            authorityQuery,
            manifestHashService)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult action = await controller.Export(runId, "docx", CancellationToken.None);

        ObjectResult blocked = action.Should().BeOfType<ObjectResult>().Subject;
        blocked.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }
}
