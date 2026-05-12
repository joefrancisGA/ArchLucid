using System.Reflection;

using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Alerts.Delivery;
using ArchLucid.Notifications;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests.Alerts.Delivery;

[Trait("Category", "Unit")]
public sealed class AlertSlackWebhookDeliveryChannelTests
{
    [Fact]
    public void ChannelType_ReturnsSlackWebhook()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        AlertSlackWebhookDeliveryChannel sut = new(delivery.Object);

        sut.ChannelType.Should().Be(AlertRoutingChannelType.SlackWebhook);
    }

    [Fact]
    public async Task SendAsync_PostsJsonToSubscriptionDestination()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        const string expectedUrl = "https://hooks.slack.com/services/test";
        string? capturedUrl = null;

        delivery.Setup(x =>
                x.DeliverAsync(
                    ChatOpsWebhookTarget.Slack,
                    It.IsAny<string>(),
                    It.IsAny<ChatOpsWebhookMessage>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Callback<ChatOpsWebhookTarget, string, ChatOpsWebhookMessage, CancellationToken, WebhookPostOptions?>(
                (_, url, _, _, _) =>
                    capturedUrl = url)
            .Returns(Task.CompletedTask);

        AlertSlackWebhookDeliveryChannel sut = new(delivery.Object);
        AlertDeliveryPayload payload = CreatePayload(expectedUrl);

        await sut.SendAsync(payload, CancellationToken.None);

        capturedUrl.Should().Be(expectedUrl);

        delivery.Verify(
            x => x.DeliverAsync(
                    ChatOpsWebhookTarget.Slack,
                    expectedUrl,
                    It.IsAny<ChatOpsWebhookMessage>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()),
            Times.Once);
    }

    [Fact]
    public async Task SendAsync_Message_IncludesSeverityTitleCategoryTriggerAndDescription()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        ChatOpsWebhookMessage? captured = null;

        delivery.Setup(x =>
                x.DeliverAsync(
                    ChatOpsWebhookTarget.Slack,
                    It.IsAny<string>(),
                    It.IsAny<ChatOpsWebhookMessage>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Callback<ChatOpsWebhookTarget, string, ChatOpsWebhookMessage, CancellationToken, WebhookPostOptions?>(
                (_, _, msg, _, _) =>
                    captured = msg)
            .Returns(Task.CompletedTask);

        AlertSlackWebhookDeliveryChannel sut = new(delivery.Object);
        AlertDeliveryPayload payload = CreatePayload("https://hooks.slack.com/x");
        payload.Alert.Severity = "Critical";
        payload.Alert.Title = "Disk full";
        payload.Alert.Category = "Infrastructure";
        payload.Alert.TriggerValue = "98%";
        payload.Alert.Description = "Expand volume or prune.";

        await sut.SendAsync(payload, CancellationToken.None);

        captured.Should().NotBeNull();

        captured!.SeverityLabel.Should().Be("Critical");
        captured.Title.Should().Be("Disk full");
        captured.SupportingParagraph.Should().Be("Category: Infrastructure\nTrigger: 98%");
        captured.Body.Should().Be("Expand volume or prune.");
    }

    [Fact]
    public async Task SendAsync_ForwardsCancellationToken()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();
        CancellationToken expected = new(canceled: true);

        delivery.Setup(x =>
                x.DeliverAsync(
                    It.IsAny<ChatOpsWebhookTarget>(),
                    It.IsAny<string>(),
                    It.IsAny<ChatOpsWebhookMessage>(),
                    It.IsAny<CancellationToken>(),
                    It.IsAny<WebhookPostOptions?>()))
            .Returns(Task.CompletedTask);

        AlertSlackWebhookDeliveryChannel sut = new(delivery.Object);

        await sut.SendAsync(CreatePayload("https://hooks.slack.com/x"), expected);

        delivery.Verify(
            x => x.DeliverAsync(
                It.IsAny<ChatOpsWebhookTarget>(),
                It.IsAny<string>(),
                It.IsAny<ChatOpsWebhookMessage>(),
                expected,
                It.IsAny<WebhookPostOptions?>()),
            Times.Once);
    }

    private static AlertDeliveryPayload CreatePayload(string destination)
    {
        return new AlertDeliveryPayload
        {
            Alert = new AlertRecord
            {
                AlertId = Guid.NewGuid(),
                Title = "T",
                Category = "C",
                Severity = "Warning",
                TriggerValue = "1",
                Description = "D",
            },
            Subscription = new AlertRoutingSubscription
            {
                Destination = destination,
                ChannelType = AlertRoutingChannelType.SlackWebhook,
            },
        };
    }
}
