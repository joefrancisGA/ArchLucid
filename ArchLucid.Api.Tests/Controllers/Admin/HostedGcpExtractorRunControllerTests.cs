using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Common;
using ArchLucid.Application.GcpExtractor;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.Controllers.Admin;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostedGcpExtractorRunControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
    };

    private static readonly Guid ConnectionId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public async Task RunAsync_returns_bad_request_when_body_is_null()
    {
        HostedGcpExtractorRunController sut = CreateSut(Mock.Of<IHostedGcpExtractorRunService>());

        IActionResult result = await sut.RunAsync(null!, CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RunAsync_returns_service_unavailable_when_feature_disabled()
    {
        Mock<IHostedGcpExtractorRunService> runService = new();
        runService
            .Setup(s => s.RunAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedGcpExtractorRunResult.CreateFeatureDisabled());

        HostedGcpExtractorRunController sut = CreateSut(runService.Object);

        IActionResult result = await sut.RunAsync(
            new HostedGcpExtractorRunBody { ConnectionId = ConnectionId },
            CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status503ServiceUnavailable);
    }

    [Fact]
    public async Task RunAsync_returns_not_found_when_not_configured()
    {
        Mock<IHostedGcpExtractorRunService> runService = new();
        runService
            .Setup(s => s.RunAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedGcpExtractorRunResult.CreateNotConfigured());

        HostedGcpExtractorRunController sut = CreateSut(runService.Object);

        IActionResult result = await sut.RunAsync(
            new HostedGcpExtractorRunBody { ConnectionId = ConnectionId },
            CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task RunAsync_returns_unprocessable_entity_when_ingest_fails()
    {
        Mock<IHostedGcpExtractorRunService> runService = new();
        runService
            .Setup(s => s.RunAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedGcpExtractorRunResult.CreateIngestFailed("ingest rejected"));

        HostedGcpExtractorRunController sut = CreateSut(runService.Object);

        IActionResult result = await sut.RunAsync(
            new HostedGcpExtractorRunBody { ConnectionId = ConnectionId },
            CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status422UnprocessableEntity);
    }

    [Fact]
    public async Task RunAsync_returns_accepted_when_run_succeeds()
    {
        Guid packageId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Mock<IHostedGcpExtractorRunService> runService = new();
        runService
            .Setup(s => s.RunAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedGcpExtractorRunResult.CreateSuccess(packageId, resourceCount: 7));

        HostedGcpExtractorRunController sut = CreateSut(runService.Object);

        IActionResult result = await sut.RunAsync(
            new HostedGcpExtractorRunBody { ConnectionId = ConnectionId },
            CancellationToken.None);

        AcceptedResult accepted = result.Should().BeOfType<AcceptedResult>().Subject;
        HostedGcpExtractorRunResponse body = accepted.Value.Should().BeOfType<HostedGcpExtractorRunResponse>().Subject;
        body.PackageId.Should().Be(packageId);
        body.ResourceCount.Should().Be(7);
    }

    private static HostedGcpExtractorRunController CreateSut(IHostedGcpExtractorRunService runService)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static p => p.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(static a => a.GetActorId()).Returns("actor-id");

        return new HostedGcpExtractorRunController(runService, scopeProvider.Object, actorContext.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
