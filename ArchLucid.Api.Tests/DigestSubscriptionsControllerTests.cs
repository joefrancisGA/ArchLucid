using ArchLucid.Api.Controllers.Advisory;
using ArchLucid.Contracts.Advisory.Delivery;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

using Xunit;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DigestSubscriptionsControllerTests
{
    [Theory]
    [InlineData("", "user@example.com")]
    [InlineData(DigestDeliveryChannelType.Email, "")]
    [InlineData("   ", "user@example.com")]
    public async Task Create_rejects_blank_channel_or_destination(string channelType, string destination)
    {
        Mock<IDigestSubscriptionRepository> subscriptions = new();
        DigestSubscriptionsController sut = CreateController(subscriptions.Object);

        IActionResult action = await sut.Create(
            new DigestSubscription
            {
                ChannelType = channelType,
                Destination = destination,
            },
            CancellationToken.None);

        ObjectResult problem = action.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        subscriptions.Verify(
            repository => repository.CreateAsync(
                It.IsAny<DigestSubscription>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Create_trims_channel_type_and_destination_before_persisting()
    {
        DigestSubscription? captured = null;
        Mock<IDigestSubscriptionRepository> subscriptions = new();
        subscriptions
            .Setup(repository => repository.CreateAsync(It.IsAny<DigestSubscription>(), It.IsAny<CancellationToken>()))
            .Callback<DigestSubscription, CancellationToken>((subscription, _) => captured = subscription)
            .Returns(Task.CompletedTask);

        DigestSubscriptionsController sut = CreateController(subscriptions.Object);

        IActionResult action = await sut.Create(
            new DigestSubscription
            {
                ChannelType = $"  {DigestDeliveryChannelType.Email}  ",
                Destination = "  user@example.com  ",
            },
            CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
        captured.Should().NotBeNull();
        captured!.ChannelType.Should().Be(DigestDeliveryChannelType.Email);
        captured.Destination.Should().Be("user@example.com");
    }

    [Theory]
    [InlineData("PagerDuty")]
    [InlineData("UnknownChannel")]
    public async Task Create_rejects_unknown_channel_types(string channelType)
    {
        Mock<IDigestSubscriptionRepository> subscriptions = new();
        DigestSubscriptionsController sut = CreateController(subscriptions.Object);

        IActionResult action = await sut.Create(
            new DigestSubscription
            {
                ChannelType = channelType,
                Destination = "user@example.com",
            },
            CancellationToken.None);

        ObjectResult problem = action.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        subscriptions.Verify(
            repository => repository.CreateAsync(
                It.IsAny<DigestSubscription>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Theory]
    [InlineData(DigestDeliveryChannelType.SlackWebhook, "http://hooks.slack.com/services/test")]
    [InlineData(DigestDeliveryChannelType.TeamsWebhook, "https://127.0.0.1/webhook")]
    public async Task Create_rejects_unsafe_webhook_destinations(string channelType, string destination)
    {
        Mock<IDigestSubscriptionRepository> subscriptions = new();
        DigestSubscriptionsController sut = CreateController(subscriptions.Object);

        IActionResult action = await sut.Create(
            new DigestSubscription
            {
                ChannelType = channelType,
                Destination = destination,
            },
            CancellationToken.None);

        ObjectResult problem = action.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        subscriptions.Verify(
            repository => repository.CreateAsync(
                It.IsAny<DigestSubscription>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static DigestSubscriptionsController CreateController(
        IDigestSubscriptionRepository subscriptions)
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(scope);

        return new DigestSubscriptionsController(
            scopeProvider.Object,
            subscriptions,
            Mock.Of<IDigestDeliveryAttemptRepository>(),
            Mock.Of<IArchitectureDigestRepository>(),
            Mock.Of<IAuditService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
