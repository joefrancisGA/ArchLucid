using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.Common;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.Controllers.Admin;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostedAzureExtractorRunControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
    };

    [Fact]
    public async Task RunAsync_returns_bad_request_when_subscription_id_blank()
    {
        HostedAzureExtractorRunController sut = CreateSut(Mock.Of<IHostedAzureExtractorRunService>());

        IActionResult result = await sut.RunAsync(
            new HostedAzureExtractorRunBody { SubscriptionId = "   " },
            CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RunAsync_returns_service_unavailable_when_feature_disabled()
    {
        Mock<IHostedAzureExtractorRunService> runService = new();
        runService
            .Setup(s => s.RunAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedAzureExtractorRunResult.CreateFeatureDisabled());

        HostedAzureExtractorRunController sut = CreateSut(runService.Object);

        IActionResult result = await sut.RunAsync(
            new HostedAzureExtractorRunBody { SubscriptionId = "sub-1" },
            CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status503ServiceUnavailable);
    }

    [Fact]
    public async Task RunAsync_returns_not_found_when_not_configured()
    {
        Mock<IHostedAzureExtractorRunService> runService = new();
        runService
            .Setup(s => s.RunAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedAzureExtractorRunResult.CreateNotConfigured());

        HostedAzureExtractorRunController sut = CreateSut(runService.Object);

        IActionResult result = await sut.RunAsync(
            new HostedAzureExtractorRunBody { SubscriptionId = "sub-1" },
            CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task RunAsync_returns_unprocessable_entity_when_throttled()
    {
        Mock<IHostedAzureExtractorRunService> runService = new();
        runService
            .Setup(s => s.RunAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedAzureExtractorRunResult.CreateThrottled("rate limited"));

        HostedAzureExtractorRunController sut = CreateSut(runService.Object);

        IActionResult result = await sut.RunAsync(
            new HostedAzureExtractorRunBody { SubscriptionId = "sub-1" },
            CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status422UnprocessableEntity);
    }

    [Fact]
    public async Task RunAsync_returns_accepted_when_run_succeeds()
    {
        Guid packageId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Mock<IHostedAzureExtractorRunService> runService = new();
        runService
            .Setup(s => s.RunAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedAzureExtractorRunResult.CreateSuccess(packageId, resourceCount: 3));

        HostedAzureExtractorRunController sut = CreateSut(runService.Object);

        IActionResult result = await sut.RunAsync(
            new HostedAzureExtractorRunBody { SubscriptionId = "sub-1" },
            CancellationToken.None);

        AcceptedResult accepted = result.Should().BeOfType<AcceptedResult>().Subject;
        HostedAzureExtractorRunResponse body = accepted.Value.Should().BeOfType<HostedAzureExtractorRunResponse>().Subject;
        body.PackageId.Should().Be(packageId);
        body.ResourceCount.Should().Be(3);
    }

    private static HostedAzureExtractorRunController CreateSut(IHostedAzureExtractorRunService runService)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static p => p.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(static a => a.GetActorId()).Returns("actor-id");

        return new HostedAzureExtractorRunController(runService, scopeProvider.Object, actorContext.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
