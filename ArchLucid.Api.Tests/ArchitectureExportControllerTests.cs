using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Application.Exports;
using ArchLucid.Core.Configuration;
using ArchLucid.Decisioning.CareerArtifacts;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureExportControllerTests
{
    [Fact]
    public async Task ExportRunSummary_returns_not_found_for_whitespace_run_id_like_GetRun()
    {
        Mock<IRunSummaryOnePagerExportService> exportService = new();
        Mock<IOptionsMonitor<GenerateRunSummaryOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new GenerateRunSummaryOptions { Enabled = true });

        ArchitectureExportController controller = new(
            exportService.Object,
            options.Object,
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult action = await controller.ExportRunSummary("   ", CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        exportService.Verify(
            s => s.GenerateMarkdownAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExportRunSummary_returns_409_when_career_export_blocked()
    {
        const string runId = "abc123def4567890abc123def4567890";

        Mock<IRunSummaryOnePagerExportService> exportService = new();
        exportService
            .Setup(s => s.GenerateMarkdownAsync(runId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new CareerArtifactExportBlockedException(
                SimulatorCareerHonestyPresenter.SimulatorRehearsalBlockedMessage,
                CareerArtifactCompletenessValidator.SimulatorRehearsalCode));

        Mock<IOptionsMonitor<GenerateRunSummaryOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new GenerateRunSummaryOptions { Enabled = true });

        IAuthorityQueryService authorityQuery = ArchLucid.TestSupport.SealedManifest.SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun();
        IManifestHashService manifestHashService = ArchLucid.TestSupport.SealedManifest.SealedManifestHashTestSupport.CreateManifestHashService();

        ArchitectureExportController controller = new(
            exportService.Object,
            options.Object,
            Mock.Of<IScopeContextProvider>(),
            authorityQuery,
            manifestHashService)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult action = await controller.ExportRunSummary(runId, CancellationToken.None);

        ObjectResult blocked = action.Should().BeOfType<ObjectResult>().Subject;
        blocked.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }
}
