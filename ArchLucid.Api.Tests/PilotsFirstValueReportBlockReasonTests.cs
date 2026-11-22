using ArchLucid.Api.Controllers.Pilots;
using ArchLucid.Application;
using ArchLucid.Application.Pilots;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class PilotsFirstValueReportBlockReasonTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Incomplete_lifecycle_returns_409_with_required_blockReason(bool pdf)
    {
        Guid runId = Guid.NewGuid();
        const string explanation = "Compare/export blocked: authority lifecycle must be Complete.";
        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(s => s.GetRunDetailAsync(
                It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>(), false))
            .ThrowsAsync(new ConflictException(explanation));
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.NewGuid() });
        PilotsController controller = new(
            Mock.Of<IPilotsApplicationService>(),
            scope.Object,
            authority.Object,
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<IManifestHashService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult action = pdf
            ? await controller.PostFirstValueReportPdf(runId.ToString("D"), CancellationToken.None)
            : await controller.GetFirstValueReport(runId.ToString("D"), CancellationToken.None);

        ObjectResult conflict = action.Should().BeOfType<ObjectResult>().Subject;
        conflict.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        ProblemDetails problem = conflict.Value.Should().BeOfType<ProblemDetails>().Subject;
        problem.Extensions.Should().ContainKey("blockReason");
        problem.Extensions["blockReason"].Should().Be(explanation);
        problem.Detail.Should().Be(explanation);
    }
}
