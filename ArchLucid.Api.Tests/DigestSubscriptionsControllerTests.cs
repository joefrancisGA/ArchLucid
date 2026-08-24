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
