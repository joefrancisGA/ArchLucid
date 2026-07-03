using ArchLucid.Api.Controllers.Reports;
using ArchLucid.Application.Reports;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ExecutiveSummaryControllerTests
{
    [Fact]
    public async Task GetExecutiveSummary_returns_service_result()
    {
        ExecutiveSummaryResult expected = new(100m, 10, 3, 5, null, 2, 1);

        Mock<IExecutiveReportsSummaryService> summary = new();
        summary
            .Setup(s => s.BuildAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        ExecutiveSummaryController controller = new(summary.Object);

        ActionResult<ExecutiveSummaryResult> action =
            await controller.GetExecutiveSummary(CancellationToken.None);

        OkObjectResult ok = action.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(expected);
    }
}
