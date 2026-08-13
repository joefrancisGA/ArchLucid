using ArchLucid.Api.Controllers.Reports;
using ArchLucid.Application.Reports;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SponsorReportControllerTests
{
    [Fact]
    public async Task GetSponsorReport_returns_service_result()
    {
        SponsorReportResult expected = new(100m, 10, 3, 5, null, 2, 1);

        Mock<ISponsorReportsSummaryService> summary = new();
        summary
            .Setup(s => s.BuildAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        SponsorReportController controller = new(summary.Object);

        ActionResult<SponsorReportResult> action =
            await controller.GetSponsorReport(CancellationToken.None);

        OkObjectResult ok = action.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(expected);
    }
}
