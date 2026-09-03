using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Application.Exports;
using ArchLucid.Core.Configuration;

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

        ArchitectureExportController controller = new(exportService.Object, options.Object)
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
}
