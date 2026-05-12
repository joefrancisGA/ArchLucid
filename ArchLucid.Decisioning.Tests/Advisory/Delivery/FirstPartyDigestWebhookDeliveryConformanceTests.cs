using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Notifications;

using ArchLucid.TestSupport.Connectors;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests.Advisory.Delivery;

[Trait("Category", "Unit")]
public sealed class FirstPartyDigestWebhookDeliveryConformanceTests
{
    [Fact]
    public async Task DigestSlackWebhook_conformance_post_json_body_does_not_echo_destination()
    {
        const string connectorName = "Advisory digest Slack incoming webhook";

        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        ChatOpsWebhookMessage? captured = null;

        delivery.Setup(x =>
                x.DeliverAsync(
                    It.IsAny<ChatOpsWebhookTarget>(),
                    It.IsAny<string>(),
                    It.IsAny<ChatOpsWebhookMessage>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Callback<ChatOpsWebhookTarget, string, ChatOpsWebhookMessage, CancellationToken, WebhookPostOptions?>(
                (_, _, msg, _, _) =>
                    captured = msg)
            .Returns(Task.CompletedTask);

        const string destination = "https://hooks.slack.com/services/DIGEST/FAKE/URL";

        DigestSlackWebhookDeliveryChannel sut = new(delivery.Object);
        await sut.SendAsync(CreateDigestPayload(destination, DigestDeliveryChannelType.SlackWebhook), CancellationToken.None);

        captured.Should().NotBeNull();
        object body = ChatOpsIncomingWebhookBodies.ForSlack(captured!);
        WebhookPostJsonBodyOutboundConnectorConformance.AssertBodyJsonDoesNotEchoDestination(connectorName, body, destination);
    }

    [Fact]
    public async Task DigestTeamsWebhook_conformance_post_json_body_does_not_echo_destination()
    {
        const string connectorName = "Advisory digest Microsoft Teams incoming webhook";

        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        ChatOpsWebhookMessage? captured = null;

        delivery.Setup(x =>
                x.DeliverAsync(
                    It.IsAny<ChatOpsWebhookTarget>(),
                    It.IsAny<string>(),
                    It.IsAny<ChatOpsWebhookMessage>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Callback<ChatOpsWebhookTarget, string, ChatOpsWebhookMessage, CancellationToken, WebhookPostOptions?>(
                (_, _, msg, _, _) =>
                    captured = msg)
            .Returns(Task.CompletedTask);

        string destination = "https://outlook.office.com/webhook/digest-fake";

        DigestTeamsWebhookDeliveryChannel sut = new(delivery.Object);
        await sut.SendAsync(CreateDigestPayload(destination, DigestDeliveryChannelType.TeamsWebhook), CancellationToken.None);

        captured.Should().NotBeNull();

        object body = ChatOpsIncomingWebhookBodies.ForTeams(captured!);
        WebhookPostJsonBodyOutboundConnectorConformance.AssertBodyJsonDoesNotEchoDestination(connectorName, body, destination);
    }

    private static DigestDeliveryPayload CreateDigestPayload(string destination, string channelType)
    {
        return new DigestDeliveryPayload
        {
            Digest = new ArchitectureDigest
            {
                DigestId = Guid.NewGuid(),
                Title = "T",
                Summary = "S",
                ContentMarkdown = "M",
            },
            Subscription = new DigestSubscription
            {
                Destination = destination,
                ChannelType = channelType,
            },
        };
    }
}
