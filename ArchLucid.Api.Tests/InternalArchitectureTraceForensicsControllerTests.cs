using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Application;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InternalArchitectureTraceForensicsControllerTests
{
    [Fact]
    public async Task GetRunTraceForensics_returns_not_found_for_whitespace_run_id_like_GetRunTraces()
    {
        Mock<IAgentExecutionTraceRepository> traces = new();
        InternalArchitectureTraceForensicsController controller = CreateController(traces.Object);

        IActionResult action = await controller.GetRunTraceForensics(
            "   ",
            pageNumber: 1,
            pageSize: 50,
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        traces.Verify(
            r => r.GetPagedSummariesByRunIdAsync(
                It.IsAny<Core.Scoping.ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static InternalArchitectureTraceForensicsController CreateController(
        IAgentExecutionTraceRepository traceRepository)
    {
        Mock<IRunRepository> runs = new();
        Mock<IScopeContextProvider> scope = new();
        Mock<IAuthorityQueryService> authority = new();
        Mock<IManifestHashService> manifestHash = new();

        InternalArchitectureTraceForensicsController controller = new(
            traceRepository,
            runs.Object,
            scope.Object,
            authority.Object,
            manifestHash.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        return controller;
    }
}
