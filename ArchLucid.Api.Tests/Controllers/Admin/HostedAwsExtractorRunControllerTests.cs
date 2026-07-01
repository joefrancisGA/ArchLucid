using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.AwsExtractor;
using ArchLucid.Application.Common;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.Controllers.Admin;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostedAwsExtractorRunControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
    };

    private static readonly Guid ConnectionId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public async Task RunAsync_returns_bad_request_when_connection_id_missing()
    {
        HostedAwsExtractorRunController sut = CreateSut(Mock.Of<IHostedAwsExtractorRunService>());

        IActionResult result = await sut.RunAsync(
            new HostedAwsExtractorRunBody { ConnectionId = Guid.Empty },
            CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RunAsync_returns_service_unavailable_when_feature_disabled()
    {
        Mock<IHostedAwsExtractorRunService> runService = new();
        runService
            .Setup(s => s.RunAsync(
                Scope.TenantId,
                ConnectionId,
                null,
                "actor-id",
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedAwsExtractorRunResult.CreateFeatureDisabled());

        HostedAwsExtractorRunController sut = CreateSut(runService.Object);

        IActionResult result = await sut.RunAsync(
            new HostedAwsExtractorRunBody { ConnectionId = ConnectionId },
            CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status503ServiceUnavailable);
    }

    [Fact]
    public async Task RunAsync_returns_not_found_when_not_configured()
    {
        Mock<IHostedAwsExtractorRunService> runService = new();
        runService
            .Setup(s => s.RunAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedAwsExtractorRunResult.CreateNotConfigured());

        HostedAwsExtractorRunController sut = CreateSut(runService.Object);

        IActionResult result = await sut.RunAsync(
            new HostedAwsExtractorRunBody { ConnectionId = ConnectionId },
            CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task RunAsync_returns_unprocessable_entity_when_collection_fails()
    {
        Mock<IHostedAwsExtractorRunService> runService = new();
        runService
            .Setup(s => s.RunAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedAwsExtractorRunResult.CreateCollectionFailed("AWS search failed"));

        HostedAwsExtractorRunController sut = CreateSut(runService.Object);

        IActionResult result = await sut.RunAsync(
            new HostedAwsExtractorRunBody { ConnectionId = ConnectionId },
            CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status422UnprocessableEntity);
    }

    [Fact]
    public async Task RunAsync_returns_accepted_when_run_succeeds()
    {
        Guid packageId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Mock<IHostedAwsExtractorRunService> runService = new();
        runService
            .Setup(s => s.RunAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedAwsExtractorRunResult.CreateSuccess(packageId, resourceCount: 12));

        HostedAwsExtractorRunController sut = CreateSut(runService.Object);

        IActionResult result = await sut.RunAsync(
            new HostedAwsExtractorRunBody { ConnectionId = ConnectionId, RunId = Guid.NewGuid() },
            CancellationToken.None);

        AcceptedResult accepted = result.Should().BeOfType<AcceptedResult>().Subject;
        HostedAwsExtractorRunResponse body = accepted.Value.Should().BeOfType<HostedAwsExtractorRunResponse>().Subject;
        body.PackageId.Should().Be(packageId);
        body.ResourceCount.Should().Be(12);
    }

    private static HostedAwsExtractorRunController CreateSut(IHostedAwsExtractorRunService runService)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static p => p.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(static a => a.GetActorId()).Returns("actor-id");

        return new HostedAwsExtractorRunController(runService, scopeProvider.Object, actorContext.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
