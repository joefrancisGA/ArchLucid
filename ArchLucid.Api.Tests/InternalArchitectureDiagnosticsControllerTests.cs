using System.Security.Claims;

using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Determinism;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InternalArchitectureDiagnosticsControllerTests
{
    [Fact]
    public async Task RunDeterminismCheck_null_body_returns_400()
    {
        InternalArchitectureDiagnosticsController controller = CreateController();

        IActionResult action = await controller.RunDeterminismCheck(
            "run-1",
            request: null,
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            bad.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.RequestBodyRequired);
    }

    [Fact]
    public async Task ReplayRun_run_not_found_returns_404()
    {
        Mock<IReplayRunService> replay = new();
        replay
            .Setup(r => r.ReplayAsync(
                "missing-run",
                It.IsAny<string>(),
                It.IsAny<bool>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RunNotFoundException("missing-run"));

        InternalArchitectureDiagnosticsController controller = CreateController(replayRunService: replay.Object);

        IActionResult action = await controller.ReplayRun(
            "missing-run",
            new ReplayRunRequest(),
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task SeedFakeResults_run_not_found_returns_404()
    {
        Mock<IArchitectureApplicationService> application = new();
        application
            .Setup(s => s.SeedFakeResultsAsync(
                "missing-run",
                It.IsAny<PilotSeedFakeResultsOptions?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SeedFakeResultsResult(
                false,
                0,
                "Run 'missing-run' was not found.",
                ApplicationServiceFailureKind.RunNotFound));

        InternalArchitectureDiagnosticsController controller =
            CreateController(architectureApplicationService: application.Object);

        IActionResult action = await controller.SeedFakeResults(
            "missing-run",
            pilotTryRealModeFellBack: false,
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task SeedFakeResults_success_returns_result_count()
    {
        Mock<IArchitectureApplicationService> application = new();
        application
            .Setup(s => s.SeedFakeResultsAsync(
                "run-1",
                It.IsAny<PilotSeedFakeResultsOptions?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SeedFakeResultsResult(true, 4, null, null));

        Mock<IAuditService> audit = new();

        InternalArchitectureDiagnosticsController controller = CreateController(
            architectureApplicationService: application.Object,
            auditService: audit.Object);

        IActionResult action = await controller.SeedFakeResults(
            "run-1",
            pilotTryRealModeFellBack: true,
            CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        SeedFakeResultsResponse response = ok.Value.Should().BeOfType<SeedFakeResultsResponse>().Subject;
        response.ResultCount.Should().Be(4);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.InternalArchitectureFakeResultsSeeded),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static InternalArchitectureDiagnosticsController CreateController(
        IReplayRunService? replayRunService = null,
        IArchitectureApplicationService? architectureApplicationService = null,
        IDeterminismCheckService? determinismCheckService = null,
        IAuditService? auditService = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000000")
        });

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("operator@test");
        actor.Setup(a => a.GetActorId()).Returns("operator@test");

        DefaultHttpContext http = new()
        {
            User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "operator@test")]))
        };

        InternalArchitectureDiagnosticsController controller = new(
            replayRunService ?? Mock.Of<IReplayRunService>(),
            architectureApplicationService ?? Mock.Of<IArchitectureApplicationService>(),
            determinismCheckService ?? Mock.Of<IDeterminismCheckService>(),
            actor.Object,
            auditService ?? Mock.Of<IAuditService>(),
            scopeProvider.Object,
            NullLogger<InternalArchitectureDiagnosticsController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = http }
        };

        return controller;
    }
}
